/** Server-side operations contracts. Never pass these configurations to storefront props. */
export type FulfillmentMode = 'print-on-demand' | 'warehouse' | 'self-fulfilled';
export type Capability = 'manufacture' | 'pick-pack' | 'ship' | 'tracking' | 'branded-packaging';
export type ExecutionOwner = 'demo' | 'shopify-app' | 'direct-api';

export type Connection = {
  id: string;
  provider: string;
  executionOwner: ExecutionOwner;
  enabled: boolean;
  capabilities: Capability[];
  countries: string[];
  /** Environment-variable reference only; credentials are resolved server-side by a real adapter. */
  credentialEnv?: string;
};

export type FulfillmentRoute = {
  id: string;
  mode: FulfillmentMode;
  connectionId: string;
  /** Must match the commerce platform's assigned fulfillment location. */
  locationId: string;
  shippingProfileId: string;
  serviceCodes: string[];
  packagingProfileId: string;
};

export type VariantBinding = {
  variantId: string;
  sku: string;
  routeId: string;
  supplierVariantId: string;
  assetSetId?: string;
};

export type FulfillmentConfig = {
  brandId: string;
  revision: string;
  environment: 'demo' | 'live';
  connections: Connection[];
  routes: FulfillmentRoute[];
  bindings: VariantBinding[];
  assetSets: { id: string; approvedForProduction: boolean; files: { url: string; sha256: string; placement: string }[] }[];
  packagingProfiles: { id: string; kind: 'supplier-standard' | 'branded'; approved: boolean }[];
  shippingProfiles: { id: string; countries: string[]; approved: boolean }[];
};

export type FulfillmentOrderLine = {
  id: string;
  orderLineId: string;
  variantId: string;
  quantity: number;
};

/** Normalize only verified events plus a freshly fetched authoritative commerce order. */
export type OrderSnapshot = {
  brandId: string;
  id: string;
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded' | 'partially-refunded';
  cancelled: boolean;
  held: boolean;
  verification: { source: 'demo' | 'shopify'; eventId: string };
  fulfillmentOrders: {
    id: string;
    locationId: string;
    deliveryMethod: 'shipping' | 'pickup' | 'local-delivery';
    country: string;
    serviceCode: string;
    /** Protected commerce record reference, not customer addresses in queue logs. */
    recipientRef: string;
    recipientRevision: string;
    lines: FulfillmentOrderLine[];
  }[];
};

export type JobLine = FulfillmentOrderLine & {
  binding: VariantBinding;
  productionAssets?: FulfillmentConfig['assetSets'][number];
};
export type FulfillmentJob = {
  key: string;
  externalId: string;
  fingerprint: string;
  environment: 'demo' | 'live';
  brandId: string;
  orderId: string;
  fulfillmentOrderId: string;
  configRevision: string;
  connection: Connection;
  route: FulfillmentRoute;
  recipientRef: string;
  recipientRevision: string;
  country: string;
  serviceCode: string;
  packaging: FulfillmentConfig['packagingProfiles'][number];
  shippingProfile: FulfillmentConfig['shippingProfiles'][number];
  lines: JobLine[];
};

export type PlanIssue = { code: string; message: string; fulfillmentOrderId?: string };
export type FulfillmentPlan = {
  status: 'blocked' | 'ready-demo' | 'ready';
  jobs: FulfillmentJob[];
  issues: PlanIssue[];
  warnings: PlanIssue[];
};

export type Shipment = {
  id: string;
  status: 'label-created' | 'in-transit' | 'delivered' | 'exception';
  lines: { fulfillmentOrderLineId: string; quantity: number }[];
  tracking?: { carrier: string; number: string; url?: string };
};

export type ProviderOrder = {
  id: string;
  externalId: string;
  status: 'draft' | 'accepted' | 'in-production' | 'partially-shipped' | 'shipped' | 'delivered' | 'cancelled' | 'needs-attention';
  shipments: Shipment[];
};

export type Quote = {
  currency: string;
  production: number;
  packaging: number;
  shipping: number;
  tax: number;
  expiresAt: string;
};

/** Contract for future adapters; checkout retail prices are separate from supplier costs. */
export interface FulfillmentAdapter {
  readonly provider: string;
  readonly environment: 'demo' | 'live';
  quote(job: FulfillmentJob): Promise<Quote>;
  findByExternalId(externalId: string): Promise<ProviderOrder | null>;
  submit(job: FulfillmentJob): Promise<ProviderOrder>;
  cancel(providerOrderId: string): Promise<'cancelled' | 'requested' | 'too-late'>;
  getOrder(providerOrderId: string): Promise<ProviderOrder>;
}

/** A production implementation needs atomic uniqueness, durable state and leases. */
export interface FulfillmentJobRepository {
  readonly durability: 'memory-demo' | 'durable';
  claim(job: FulfillmentJob): Promise<
    | { kind: 'claimed'; token: string }
    | { kind: 'existing'; order: ProviderOrder }
    | { kind: 'busy' }
  >;
  complete(key: string, token: string, order: ProviderOrder): Promise<void>;
  requireReconciliation(key: string, token: string): Promise<void>;
}
