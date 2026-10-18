import { randomUUID } from 'node:crypto';
import type { FulfillmentAdapter, FulfillmentJob, FulfillmentJobRepository, OrderSnapshot, ProviderOrder } from './types';
import { getBrand } from '../../lib/brand';
import { getFulfillmentConfig } from './config';

/** Explicitly transient simulation storage. Not suitable for webhooks or production workers. */
export class MemoryDemoJobRepository implements FulfillmentJobRepository {
  readonly durability = 'memory-demo' as const;
  private records = new Map<string, { fingerprint: string; token: string; state: 'claimed' | 'complete' | 'reconcile'; order?: ProviderOrder }>();
  async claim(job: FulfillmentJob) {
    const existing = this.records.get(job.key);
    if (existing) {
      if (existing.fingerprint !== job.fingerprint) throw new Error('Previously claimed order changed; manual reconciliation required.');
      if (existing.state === 'complete') return { kind: 'existing' as const, order: structuredClone(existing.order!) };
      return { kind: 'busy' as const };
    }
    const token = randomUUID();
    this.records.set(job.key, { fingerprint: job.fingerprint, token, state: 'claimed' });
    return { kind: 'claimed' as const, token };
  }
  async complete(key: string, token: string, order: ProviderOrder) {
    const record = this.records.get(key);
    if (!record || record.token !== token || record.state !== 'claimed') throw new Error('Invalid claim.');
    record.state = 'complete'; record.order = structuredClone(order);
  }
  async requireReconciliation(key: string, token: string) {
    const record = this.records.get(key);
    if (!record || record.token !== token) throw new Error('Invalid claim.');
    if (record.state === 'complete') return;
    record.state = 'reconcile';
  }
}

export class DemoSupplierAdapter implements FulfillmentAdapter {
  readonly provider = 'demo';
  readonly environment = 'demo' as const;
  submissions = 0;
  private orders = new Map<string, ProviderOrder>();
  async quote() { return { currency: 'USD', production: 0, packaging: 0, shipping: 0, tax: 0, expiresAt: new Date(0).toISOString() }; }
  async findByExternalId(externalId: string) { return structuredClone([...this.orders.values()].find(o => o.externalId === externalId) ?? null); }
  async submit(job: FulfillmentJob) {
    if (job.environment !== 'demo' || job.connection.executionOwner !== 'demo') throw new Error('Demo adapter refuses real orders.');
    const existing = await this.findByExternalId(job.externalId);
    if (existing) return existing;
    this.submissions += 1;
    const order: ProviderOrder = { id: `DEMO-${job.externalId}`, externalId: job.externalId, status: 'accepted', shipments: [] };
    this.orders.set(order.id, order);
    return structuredClone(order);
  }
  async getOrder(id: string) { const order = this.orders.get(id); if (!order) throw new Error('Unknown demo order.'); return structuredClone(order); }
  async cancel(id: string) {
    const order = this.orders.get(id);
    if (!order) throw new Error('Unknown demo order.');
    if (['in-production', 'partially-shipped', 'shipped', 'delivered'].includes(order.status)) return 'too-late' as const;
    order.status = 'cancelled'; return 'cancelled' as const;
  }
}

export function demoOrder(brandId: 'apres' | 'desk'): OrderSnapshot {
  const brand = getBrand(brandId);
  const config = getFulfillmentConfig(brandId);
  return {
    brandId, id: `DEMO-${brandId}-001`, paymentStatus: 'paid', cancelled: false, held: false,
    verification: { source: 'demo', eventId: `DEMO-${brandId}-paid` },
    fulfillmentOrders: [{ id: `DEMO-${brandId}-fulfillment-1`, locationId: config.routes[0].locationId,
      country: 'US', deliveryMethod: 'shipping', serviceCode: 'standard', recipientRef: 'DEMO-no-customer-address', recipientRevision: 'demo-address-v1',
      lines: [{ id: 'DEMO-fulfillment-line-1', orderLineId: 'DEMO-order-line-1', variantId: brand.products[0].variants[0].id, quantity: 1 }] }],
  };
}
