import { getBrand } from '../../lib/brand';
import type { FulfillmentConfig } from './types';

/** Demo routing only. No supplier account, approved production files, or live SKUs exist yet. */
export function getFulfillmentConfig(brandId: 'apres' | 'desk'): FulfillmentConfig {
  if (typeof window !== 'undefined') throw new Error('Fulfillment configuration belongs on the server.');
  const brand = getBrand(brandId);
  const pod = brandId === 'apres';
  const connectionId = `${brandId}-supplier-demo`;
  const routeId = `${brandId}-standard`;
  return {
    brandId,
    revision: 'concept-v1',
    environment: 'demo',
    connections: [{ id: connectionId, provider: 'demo', executionOwner: 'demo', enabled: true,
      capabilities: pod ? ['manufacture', 'pick-pack', 'ship', 'tracking'] : ['pick-pack', 'ship', 'tracking'], countries: ['US'] }],
    routes: [{ id: routeId, mode: pod ? 'print-on-demand' : 'warehouse', connectionId,
      locationId: `${brandId}-demo-location`, shippingProfileId: 'domestic-demo', serviceCodes: ['standard'], packagingProfileId: 'standard-demo' }],
    bindings: brand.products.flatMap(product => product.variants.map(variant => ({
      variantId: variant.id,
      sku: `${brandId.toUpperCase()}-${variant.id.toUpperCase()}`,
      routeId,
      supplierVariantId: `DEMO-${variant.id}`,
      ...(pod ? { assetSetId: `concept-${product.id}` } : {}),
    }))),
    assetSets: pod ? brand.products.map(product => ({ id: `concept-${product.id}`, approvedForProduction: false, files: [] })) : [],
    packagingProfiles: [{ id: 'standard-demo', kind: 'supplier-standard', approved: false }],
    shippingProfiles: [{ id: 'domestic-demo', countries: ['US'], approved: false }],
  };
}
