const apiBaseUrlMeta = document.querySelector('meta[name="api-base-url"]');

export const APP_CONFIG = Object.freeze({
  apiBaseUrl: apiBaseUrlMeta && apiBaseUrlMeta.content
    ? apiBaseUrlMeta.content.replace(/\/+$/, "")
    : "http://localhost:5030"
});
