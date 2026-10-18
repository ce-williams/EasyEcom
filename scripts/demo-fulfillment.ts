import { getBrand } from '../src/lib/brand';
import { getFulfillmentConfig } from '../src/server/fulfillment/config';
import { planFulfillment } from '../src/server/fulfillment/planner';
import { demoOrder, DemoSupplierAdapter, MemoryDemoJobRepository } from '../src/server/fulfillment/demo';
import { dispatchDemo } from '../src/server/fulfillment/dispatch-demo';

async function main() {
  for (const brandId of ['apres', 'desk'] as const) {
    const config = getFulfillmentConfig(brandId);
    const plan = planFulfillment(demoOrder(brandId), config, getBrand(brandId));
    if (plan.status !== 'ready-demo') throw new Error(JSON.stringify(plan.issues));
    const adapter = new DemoSupplierAdapter();
    const repository = new MemoryDemoJobRepository();
    const first = await dispatchDemo(plan.jobs[0], adapter, repository);
    const replay = await dispatchDemo(plan.jobs[0], adapter, repository);
    console.log(JSON.stringify({ brand: brandId, mode: config.routes[0].mode, plan: plan.status,
      status: first.status, replayReusedOrder: first.id === replay.id, supplierSubmissions: adapter.submissions,
      warnings: plan.warnings.map(w => w.code), note: 'Simulation only. No supplier was contacted or charged.' }, null, 2));
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
