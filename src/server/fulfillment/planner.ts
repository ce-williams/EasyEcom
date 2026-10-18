import { createHash } from 'node:crypto';
import type { Brand } from '../../lib/types';
import type { Capability, FulfillmentConfig, FulfillmentJob, FulfillmentPlan, OrderSnapshot, PlanIssue } from './types';

const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const unique = (values: string[]) => new Set(values).size === values.length;

export function validateFulfillmentConfig(config: FulfillmentConfig, brand: Brand): PlanIssue[] {
  const issues: PlanIssue[] = [];
  const fail = (code: string, message: string) => issues.push({ code, message });
  if (config.brandId !== brand.id || !config.revision) fail('invalid-identity', 'Brand and fulfillment configuration must match and be versioned.');
  if (![config.connections.map(c => c.id), config.routes.map(r => r.id), config.bindings.map(b => b.variantId), config.bindings.map(b => b.sku), config.assetSets.map(a => a.id), config.shippingProfiles.map(s => s.id), config.packagingProfiles.map(p => p.id)].every(unique)) fail('duplicate-mapping', 'Connection, route, variant, SKU and profile IDs must be unique.');
  const variantIds = new Set(brand.products.flatMap(p => p.variants.map(v => v.id)));
  for (const variantId of variantIds) if (!config.bindings.some(b => b.variantId === variantId)) fail('missing-mapping', `No fulfillment mapping for ${variantId}.`);
  for (const binding of config.bindings) {
    if (!variantIds.has(binding.variantId) || !binding.sku || !binding.supplierVariantId) fail('invalid-binding', 'Every binding needs a known variant, SKU and supplier variant reference.');
    const route = config.routes.find(r => r.id === binding.routeId);
    if (!route) { fail('missing-route', `No route for ${binding.variantId}.`); continue; }
    if (route.mode === 'print-on-demand' && !config.assetSets.some(a => a.id === binding.assetSetId)) fail('missing-artwork', `No production asset set for ${binding.variantId}.`);
  }
  for (const route of config.routes) {
    const connection = config.connections.find(c => c.id === route.connectionId);
    if (!connection?.enabled) { fail('provider-disabled', `Route ${route.id} has no enabled provider.`); continue; }
    const required: Capability[] = route.mode === 'print-on-demand' ? ['manufacture', 'pick-pack', 'ship'] : ['pick-pack', 'ship'];
    if (required.some(c => !connection.capabilities.includes(c))) fail('missing-capability', `Provider cannot perform ${route.mode}.`);
    const packaging = config.packagingProfiles.find(p => p.id === route.packagingProfileId);
    if (!packaging || !config.shippingProfiles.some(s => s.id === route.shippingProfileId) || !route.locationId || !route.serviceCodes.length) fail('invalid-route', `Route ${route.id} needs packaging, shipping, services and a location.`);
    if (packaging?.kind === 'branded' && !connection.capabilities.includes('branded-packaging')) fail('packaging-unsupported', `Provider cannot offer the requested branded packaging.`);
    if (config.environment === 'live' && connection.executionOwner === 'demo') fail('demo-in-live', 'Demo providers cannot be enabled for live routing.');
  }
  return issues;
}

export function planFulfillment(order: OrderSnapshot, config: FulfillmentConfig, brand: Brand): FulfillmentPlan {
  const issues = validateFulfillmentConfig(config, brand);
  const warnings: PlanIssue[] = [];
  const jobs: FulfillmentJob[] = [];
  const fail = (code: string, message: string, fulfillmentOrderId?: string) => issues.push({ code, message, fulfillmentOrderId });
  if (order.brandId !== config.brandId) fail('wrong-store', 'An order cannot cross store boundaries.');
  if (!order.id || !order.verification.eventId || order.paymentStatus !== 'paid' || order.cancelled || order.held) fail('order-not-released', 'Only paid, active, unheld orders can be planned. Refunds require review.');
  if ((config.environment === 'live') !== (order.verification.source === 'shopify')) fail('wrong-environment', 'Demo events and live verified commerce events cannot be mixed.');
  if (!order.fulfillmentOrders.length || !unique(order.fulfillmentOrders.map(f => f.id))) fail('invalid-fulfillment-orders', 'Require distinct commerce-assigned fulfillment orders.');
  const seenLines = new Set<string>();
  for (const fo of order.fulfillmentOrders) {
    const before = issues.length;
    if (!fo.id || !fo.recipientRef || !fo.recipientRevision || !/^[A-Z]{2}$/.test(fo.country) || fo.deliveryMethod !== 'shipping' || !fo.lines.length) fail('invalid-delivery', 'Require a supported shipping group and versioned protected recipient reference.', fo.id);
    const lines = fo.lines.map(line => {
      if (!line.id || !line.orderLineId || seenLines.has(line.id) || !Number.isSafeInteger(line.quantity) || line.quantity < 1) fail('invalid-line', 'Fulfillment line IDs must be distinct and quantities positive integers.', fo.id);
      seenLines.add(line.id);
      const binding = config.bindings.find(b => b.variantId === line.variantId);
      if (!binding) fail('missing-mapping', `No fulfillment mapping for ${line.variantId}.`, fo.id);
      const assets = config.assetSets.find(a => a.id === binding?.assetSetId);
      return binding ? { ...line, binding: structuredClone(binding), ...(assets ? { productionAssets: structuredClone(assets) } : {}) } : null;
    }).filter(line => line !== null);
    const routes = [...new Set(lines.map(line => line.binding.routeId))];
    if (routes.length !== 1) { fail('routing-conflict', 'Split or reassign mixed-provider groups in the commerce platform first.', fo.id); continue; }
    const route = config.routes.find(r => r.id === routes[0]);
    const connection = config.connections.find(c => c.id === route?.connectionId);
    if (!route || !connection) continue;
    if (route.locationId !== fo.locationId) fail('location-mismatch', 'Provider route disagrees with the commerce-assigned location.', fo.id);
    const shipping = config.shippingProfiles.find(s => s.id === route.shippingProfileId);
    const packaging = config.packagingProfiles.find(p => p.id === route.packagingProfileId);
    if (!connection.countries.includes(fo.country) || !shipping?.countries.includes(fo.country) || !route.serviceCodes.includes(fo.serviceCode)) fail('unsupported-shipping', 'Destination or shipping service is unsupported.', fo.id);
    const assets = lines.map(line => config.assetSets.find(a => a.id === line.binding.assetSetId));
    const unapprovedArt = route.mode === 'print-on-demand' && assets.some(a => !a?.approvedForProduction || !a.files.length || a.files.some(file => !/^https:\/\//.test(file.url) || !/^[a-f0-9]{64}$/.test(file.sha256)));
    if (unapprovedArt || !packaging?.approved || !shipping?.approved) {
      const issue = { code: 'launch-approval-missing', message: 'Artwork, packaging or shipping is not approved for production.', fulfillmentOrderId: fo.id };
      (config.environment === 'demo' ? warnings : issues).push(issue);
    }
    if (issues.length !== before) continue;
    const key = `fulfillment:${config.brandId}:${order.id}:${fo.id}`;
    if (!packaging || !shipping) continue;
    const snapshot = { configRevision: config.revision, connection: structuredClone(connection), route: structuredClone(route), recipientRef: fo.recipientRef, recipientRevision: fo.recipientRevision,
      country: fo.country, serviceCode: fo.serviceCode, packaging: structuredClone(packaging), shippingProfile: structuredClone(shipping), lines: lines.sort((a, b) => a.id.localeCompare(b.id)) };
    jobs.push({ ...snapshot, key, externalId: `ec_${hash(key).slice(0, 29)}`, fingerprint: hash(snapshot), environment: config.environment, brandId: config.brandId, orderId: order.id, fulfillmentOrderId: fo.id });
  }
  // Fail closed for the whole snapshot; never silently ship only its mappable lines.
  return { status: issues.length ? 'blocked' : config.environment === 'demo' ? 'ready-demo' : 'ready', jobs: issues.length ? [] : jobs, issues, warnings };
}
