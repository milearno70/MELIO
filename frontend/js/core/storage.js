const STORAGE_PREFIX = "melio:";

export function readBooleanPreference(name, fallback = false) {
  try {
    const storedValue = window.localStorage.getItem(`${STORAGE_PREFIX}${name}`);
    return storedValue === null ? fallback : storedValue === "true";
  } catch (error) {
    console.warn("MELIO could not read a local preference.", error);
    return fallback;
  }
}

export function writeBooleanPreference(name, value) {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${name}`, String(Boolean(value)));
  } catch (error) {
    console.warn("MELIO could not save a local preference.", error);
  }
}

export function readStoredData(name, fallback) {
  try {
    const storedValue = window.localStorage.getItem(`${STORAGE_PREFIX}${name}`);
    return storedValue === null ? fallback : JSON.parse(storedValue);
  } catch (error) {
    console.warn(`MELIO could not read "${name}" from local storage.`, error);
    return fallback;
  }
}

export function writeStoredData(name, value) {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${name}`, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`MELIO could not save "${name}" to local storage.`, error);
    return false;
  }
}
