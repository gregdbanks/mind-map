// Lightweight analytics wrapper for GA4 (gtag.js)
// Events fire to window.gtag if available, otherwise silently no-op

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type EventParams = Record<string, string | number | boolean>;

function track(eventName: string, params?: EventParams): void {
  if (typeof window !== 'undefined') {
    window.gtag?.('event', eventName, params);
  }
}

export const analytics = {
  // Auth
  signUp: () => track('sign_up', { method: 'cognito' }),
  login: () => track('login', { method: 'cognito' }),

  // Maps
  createMap: () => track('create_map'),
  importMap: (source: string) => track('import_map', { source }),

  // Library
  publishToLibrary: (category: string) => track('publish_to_library', { category }),
  forkMap: (mapId: string) => track('fork_map', { map_id: mapId }),
  rateMap: (rating: number) => track('rate_map', { rating }),

  // Pro / Monetization
  checkoutStart: (plan: string) => track('begin_checkout', { plan }),
  checkoutSuccess: () => track('purchase'),
  exportBlocked: (format: string) => track('export_blocked', { format }),

  // Export
  exportMap: (format: string) => track('export_map', { format }),

  // Cloud
  cloudSave: (mapId: string) => track('cloud_save', { map_id: mapId }),

  // Sharing
  shareEnable: (mapId: string) => track('share_enable', { map_id: mapId }),
  shareDisable: (mapId: string) => track('share_disable', { map_id: mapId }),

  // Collaboration
  collabInviteCreate: () => track('collab_invite_create'),
  collabJoin: () => track('collab_join'),

  // Templates
  useTemplate: (templateName: string) => track('use_template', { template_name: templateName }),
};
