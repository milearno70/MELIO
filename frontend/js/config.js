const isLocalDevelopment = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const configuredApiBaseUrl = window.MELIO_API_BASE_URL?.trim();
const apiBaseUrl = configuredApiBaseUrl || (isLocalDevelopment ? "https://localhost:7259" : "");

if (!apiBaseUrl) {
  throw new Error("Production deployment must provide window.MELIO_API_BASE_URL.");
}

let parsedApiUrl;
try {
  parsedApiUrl = new URL(apiBaseUrl);
} catch {
  throw new Error("MELIO_API_BASE_URL must be an absolute HTTPS URL.");
}

if (parsedApiUrl.protocol !== "https:" || parsedApiUrl.username || parsedApiUrl.password) {
  throw new Error("MELIO_API_BASE_URL must use HTTPS and must not contain credentials.");
}

export const APP_CONFIG = Object.freeze({
  apiBaseUrl: parsedApiUrl.href.replace(/\/+$/, "")
});
