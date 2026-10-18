import type { FulfillmentAdapter, FulfillmentJob, FulfillmentJobRepository, ProviderOrder } from './types';

/** Exercise the boundary safely. There is intentionally NO live dispatch entry point yet. */
export async function dispatchDemo(job: FulfillmentJob, adapter: FulfillmentAdapter, repository: FulfillmentJobRepository): Promise<ProviderOrder> {
  if (job.environment !== 'demo' || adapter.environment !== 'demo' || job.connection.executionOwner !== 'demo') throw new Error('Demo dispatch refuses live or Shopify-managed orders.');
  if (job.connection.provider !== adapter.provider) throw new Error('Wrong provider adapter.');
  const claim = await repository.claim(job);
  if (claim.kind === 'existing') return claim.order;
  if (claim.kind === 'busy') throw new Error('Job is already claimed or requires reconciliation.');
  try {
    // Recover a provider-accepted order after a lost response instead of submitting it again.
    const result = await adapter.findByExternalId(job.externalId) ?? await adapter.submit(job);
    if (result.externalId !== job.externalId) throw new Error('Provider response identity mismatch.');
    await repository.complete(job.key, claim.token, result);
    return result;
  } catch (error) {
    // A network timeout may mean the supplier accepted and charged the order.
    // Do not release this claim for a blind retry or switch to another supplier.
    await repository.requireReconciliation(job.key, claim.token);
    throw error;
  }
}
