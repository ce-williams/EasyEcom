import assert from 'node:assert/strict';
import test from 'node:test';
import { getBrand } from '../src/lib/brand';
import { getFulfillmentConfig } from '../src/server/fulfillment/config';
import { planFulfillment, validateFulfillmentConfig } from '../src/server/fulfillment/planner';
import { demoOrder, DemoSupplierAdapter, MemoryDemoJobRepository } from '../src/server/fulfillment/demo';
import { dispatchDemo } from '../src/server/fulfillment/dispatch-demo';
import type { FulfillmentJob } from '../src/server/fulfillment/types';

function fixture(brandId: 'apres' | 'desk' = 'apres') {
  const brand = getBrand(brandId);
  const config = getFulfillmentConfig(brandId);
  const order = demoOrder(brandId);
  return { brand, config, order, plan: () => planFulfillment(order, config, brand) };
}

test('each brand maps every variant; POD and warehouse use the same planner', () => {
  for (const id of ['apres', 'desk'] as const) {
    const f = fixture(id);
    assert.deepEqual(validateFulfillmentConfig(f.config, f.brand), []);
    assert.equal(f.plan().status, 'ready-demo');
    assert.equal(f.config.bindings.length, f.brand.products.flatMap(p => p.variants).length);
    assert.equal(f.plan().jobs[0].route.mode, id === 'apres' ? 'print-on-demand' : 'warehouse');
    assert.ok(f.plan().warnings.some(w => w.code === 'launch-approval-missing'));
  }
});

test('unpaid, failed, refunded, cancelled, held and wrong-store orders never produce jobs', () => {
  for (const status of ['pending', 'failed', 'refunded', 'partially-refunded'] as const) {
    const f = fixture(); f.order.paymentStatus = status;
    assert.equal(f.plan().status, 'blocked'); assert.equal(f.plan().jobs.length, 0);
  }
  for (const field of ['cancelled', 'held'] as const) { const f = fixture(); f.order[field] = true; assert.equal(f.plan().status, 'blocked'); }
  const f = fixture(); f.order.brandId = 'desk'; assert.equal(f.plan().status, 'blocked');
});

test('missing SKU mappings fail the whole snapshot instead of silently fulfilling a subset', () => {
  const f = fixture(); f.order.fulfillmentOrders[0].lines.push({ ...f.order.fulfillmentOrders[0].lines[0], id: 'unmapped-line', variantId: 'unknown' });
  assert.equal(f.plan().status, 'blocked'); assert.deepEqual(f.plan().jobs, []);
  f.config.bindings.pop(); assert.ok(validateFulfillmentConfig(f.config, f.brand).some(i => i.code === 'missing-mapping'));
});

test('manufacturing and branded packaging require explicit provider capabilities', () => {
  const f = fixture(); f.config.connections[0].capabilities = ['ship'];
  assert.ok(f.plan().issues.some(i => i.code === 'missing-capability'));
  const g = fixture(); g.config.packagingProfiles[0].kind = 'branded';
  assert.ok(g.plan().issues.some(i => i.code === 'packaging-unsupported'));
});

test('unsupported destinations, services, locations and delivery types are held for review', () => {
  const changes = [{ country: 'CA' }, { serviceCode: 'overnight' }, { locationId: 'another-warehouse' }, { deliveryMethod: 'pickup' as const }];
  for (const change of changes) { const f = fixture(); Object.assign(f.order.fulfillmentOrders[0], change); assert.equal(f.plan().status, 'blocked'); }
});

test('split fulfillment orders stay independent, with stable IDs across webhook retries', () => {
  const f = fixture(); const second = structuredClone(f.order.fulfillmentOrders[0]);
  second.id = 'second-fulfillment'; second.lines[0].id = 'second-fulfillment-line';
  f.order.fulfillmentOrders.push(second);
  const first = f.plan(); assert.equal(first.jobs.length, 2);
  assert.notEqual(first.jobs[0].externalId, first.jobs[1].externalId);
  assert.ok(first.jobs[0].externalId.length <= 32);
  f.order.verification.eventId = 'another-webhook-delivery';
  assert.equal(f.plan().jobs[0].externalId, first.jobs[0].externalId);
});

test('invalid quantities and duplicate fulfillment lines are rejected', () => {
  for (const quantity of [0, -1, .5, Number.MAX_SAFE_INTEGER + 1]) { const f = fixture(); f.order.fulfillmentOrders[0].lines[0].quantity = quantity; assert.equal(f.plan().status, 'blocked'); }
  const f = fixture(); f.order.fulfillmentOrders[0].lines.push(structuredClone(f.order.fulfillmentOrders[0].lines[0])); assert.equal(f.plan().status, 'blocked');
});

test('live planning cannot use demo events, mock connections or unapproved launch inputs', () => {
  const f = fixture(); f.config.environment = 'live';
  assert.equal(f.plan().status, 'blocked');
  f.order.verification.source = 'shopify';
  f.config.connections[0].executionOwner = 'shopify-app';
  f.config.connections[0].provider = 'printful';
  assert.ok(f.plan().issues.some(i => i.code === 'launch-approval-missing'));
});

test('order jobs freeze artwork/routing and detect changes without minting a new purchase key', async () => {
  const f = fixture(); const original = f.plan().jobs[0];
  const repository = new MemoryDemoJobRepository(); const adapter = new DemoSupplierAdapter();
  await dispatchDemo(original, adapter, repository);
  f.config.bindings[0].supplierVariantId = 'different-supplier-variant';
  const changed = f.plan().jobs[0];
  assert.equal(changed.key, original.key); assert.notEqual(changed.fingerprint, original.fingerprint);
  assert.notEqual(changed.lines[0].binding.supplierVariantId, original.lines[0].binding.supplierVariantId);
  await assert.rejects(dispatchDemo(changed, adapter, repository), /changed/);
  const assetBefore = original.lines[0].productionAssets!.approvedForProduction;
  f.config.assetSets[0].approvedForProduction = true;
  assert.equal(original.lines[0].productionAssets!.approvedForProduction, assetBefore);
});

test('duplicate and concurrent deliveries do not submit a second supplier order', async () => {
  const job = fixture().plan().jobs[0];
  const repository = new MemoryDemoJobRepository(); const adapter = new DemoSupplierAdapter();
  const outcomes = await Promise.allSettled([dispatchDemo(job, adapter, repository), dispatchDemo(job, adapter, repository)]);
  assert.equal(outcomes.filter(r => r.status === 'fulfilled').length, 1);
  const replay = await dispatchDemo(job, adapter, repository);
  assert.equal(replay.externalId, job.externalId); assert.equal(adapter.submissions, 1);
});

test('provider lookup recovers a lost successful response and ambiguous failures stop blind retries', async () => {
  const job = fixture().plan().jobs[0];
  const adapter = new DemoSupplierAdapter(); await adapter.submit(job);
  await dispatchDemo(job, adapter, new MemoryDemoJobRepository());
  assert.equal(adapter.submissions, 1);
  class TimeoutAfterAccept extends DemoSupplierAdapter {
    override async submit(j: FulfillmentJob): Promise<never> { await super.submit(j); throw new Error('Connection lost after supplier accepted.'); }
  }
  const timeout = new TimeoutAfterAccept(); const repository = new MemoryDemoJobRepository();
  await assert.rejects(dispatchDemo(job, timeout, repository), /Connection lost/);
  await assert.rejects(dispatchDemo(job, timeout, repository), /reconciliation/);
  assert.equal(timeout.submissions, 1);
});

test('demo dispatch refuses real or Shopify-managed execution and cancellations are explicit', async () => {
  const job = fixture().plan().jobs[0]; const adapter = new DemoSupplierAdapter(); const repository = new MemoryDemoJobRepository();
  await assert.rejects(dispatchDemo({ ...job, environment: 'live' }, adapter, repository), /refuses/);
  await assert.rejects(dispatchDemo({ ...job, connection: { ...job.connection, executionOwner: 'shopify-app' } }, adapter, repository), /refuses/);
  const order = await dispatchDemo(job, adapter, repository);
  assert.equal(await adapter.cancel(order.id), 'cancelled');
  assert.equal((await adapter.getOrder(order.id)).status, 'cancelled');
});
