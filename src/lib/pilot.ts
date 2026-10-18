// Only public checkout settings belong in the browser. Credentials stay server-side.
export type PilotCopy = {
  supportEmail: string;
  shipping: string;
  returns: string;
  productDetails: string;
  privacy: string;
  terms: string;
};
export type PilotStatus = {
  mode: 'preview' | 'paused' | 'test' | 'live';
  variantIds: string[];
  copy?: PilotCopy;
};
