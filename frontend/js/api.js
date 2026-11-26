import { APP_CONFIG } from "./config.js";

const TOKEN_KEY = "melio:auth-token";

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function getAuthToken() {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY) ||
      window.localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error("MELIO could not read the authentication token.", error);
    return null;
  }
}

export function setAuthToken(token, remember = false) {
  try {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(TOKEN_KEY);
    const storage = remember ? window.localStorage : window.sessionStorage;
    storage.setItem(TOKEN_KEY, token);
  } catch (error) {
    clearAuthToken();
    throw new Error("MELIO could not save your sign-in. Check your browser storage settings.", { cause: error });
  }
}

export function clearAuthToken() {
  try {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error("MELIO could not clear the authentication token.", error);
  }
}

function errorMessage(body, status) {
  if (typeof body?.message === "string") return body.message;
  if (body?.errors && typeof body.errors === "object") {
    const validationMessages = Object.values(body.errors).flat().filter((message) => typeof message === "string");
    if (validationMessages.length) return validationMessages.join(" ");
  }
  if (typeof body?.title === "string") return body.title;
  return `The request failed (${status}).`;
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${APP_CONFIG.apiBaseUrl}${path}`, {
    ...options,
    headers
  });

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new ApiError(errorMessage(body, response.status), response.status, body);
  }

  return body;
}
