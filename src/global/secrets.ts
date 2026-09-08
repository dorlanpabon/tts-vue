// Claves API en reposo: cifradas con safeStorage del SO si esta disponible,
// con caida a texto plano. Nunca relanza: un fallo devuelve "".
const Store = require("electron-store");
const store = new Store();

const PREFIX = "enc:v1:";

function safeApi(): any {
  try {
    const electron = require("electron");
    const api = electron && electron.safeStorage;
    if (api && typeof api.isEncryptionAvailable === "function" && api.isEncryptionAvailable()) {
      return api;
    }
  } catch (e) {
    // fuera de Electron o cifrado no disponible
  }
  return null;
}

export function getSecret(key: string): string {
  try {
    const raw = store.get(key);
    if (typeof raw !== "string" || raw === "") return "";
    if (!raw.startsWith(PREFIX)) return raw;
    const api = safeApi();
    if (!api) return "";
    return api.decryptString(Buffer.from(raw.slice(PREFIX.length), "base64"));
  } catch (e) {
    return "";
  }
}

export function setSecret(key: string, value: string) {
  try {
    const v = value == null ? "" : String(value);
    const api = safeApi();
    if (v !== "" && api) {
      store.set(key, PREFIX + api.encryptString(v).toString("base64"));
    } else {
      store.set(key, v);
    }
  } catch (e) {
    try {
      store.set(key, value == null ? "" : String(value));
    } catch (e2) {
      // sin almacenamiento: no se persiste
    }
  }
}

// true si hay algo guardado (cifrado o no). Para migraciones.
export function hasSecret(key: string): boolean {
  try {
    const raw = store.get(key);
    return typeof raw === "string" && raw !== "";
  } catch (e) {
    return false;
  }
}
