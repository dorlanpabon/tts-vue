// Clasificacion centralizada de errores TTS.
// Los errores cruzan IPC (main<->renderer) serializados y pierden su tipo,
// asi que todo se detecta por texto: message, errorDetails (SDK Azure) o JSON.
export function errText(err: any): string {
  if (err == null) return "";
  if (typeof err === "string") return err;
  const message = (err as any).message;
  const details = (err as any).errorDetails;
  if (typeof message === "string" && message !== "") {
    const extra =
      typeof details === "string" && details !== ""
        ? ` | ${details.slice(0, 300)}`
        : "";
    return `${message}${extra}`;
  }
  if (typeof details === "string" && details !== "") return details;
  try {
    return JSON.stringify(err).slice(0, 500);
  } catch (e) {
    return String(err);
  }
}

function hasNum(s: string, n: string): boolean {
  return new RegExp(`(^|[^0-9])${n}([^0-9]|$)`).test(s);
}

export type TtsErrorKind = "rateLimited" | "accessDenied" | "azureFailed" | "other";

// Orden importa: un fallo de Azure nunca se reporta como cuota gratuita.
// Un 401 suelto en TTS solo puede venir de Azure (el trial usa 429/403/400).
export function classifyTtsError(err: any): TtsErrorKind {
  const s = errText(err);
  if (s.includes("TTS_AZURE_FAILED")) return "azureFailed";
  if (
    s.includes("TTS_RATE_LIMITED") ||
    /toomanyrequests/i.test(s) ||
    hasNum(s, "429")
  ) {
    return "rateLimited";
  }
  if (s.includes("TTS_ACCESS_DENIED") || hasNum(s, "403")) {
    return "accessDenied";
  }
  if (hasNum(s, "401") || /unauthorized/i.test(s)) return "azureFailed";
  return "other";
}

// true si el fallo es por cuota/acceso denegado en los endpoints gratuitos.
export function isQuotaError(err: any): boolean {
  const kind = classifyTtsError(err);
  return kind === "rateLimited" || kind === "accessDenied";
}
