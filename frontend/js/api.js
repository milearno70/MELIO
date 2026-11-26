import { APP_CONFIG } from "./config.js";

const TOKEN_KEY = "melio:auth-token";

export class ApiError extends Error {
  constructor(message, status, body, cause) {
    super(message, { cause });
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
  let cleared = true;
  for (const storageName of ["sessionStorage", "localStorage"]) {
    try {
      window[storageName].removeItem(TOKEN_KEY);
    } catch (error) {
      cleared = false;
      console.error("MELIO could not clear the authentication token.", error);
    }
  }
  return cleared;
}

function errorMessage(body, status) {
  if (status === 0) return "The MELIO server could not be reached. Check your connection and try again.";
  if (status >= 500) return "The MELIO server is temporarily unavailable. Please try again shortly.";
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

  let response;
  try {
    response = await fetch(`${APP_CONFIG.apiBaseUrl}${path}`, {
      ...options,
      headers
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new ApiError(errorMessage(null, 0), 0, null, error);
  }

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
