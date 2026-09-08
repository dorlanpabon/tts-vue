// Listas de modelos IA gratuitos + seleccion de fallback.
// Modulo puro (sin Electron): compartido por main (gpt-api), UI y tests.
export interface FreeModel {
  id: string;
  label: string;
}

export const OPENROUTER_FREE_MODELS: FreeModel[] = [
  { id: "google/gemma-4-31b-it:free", label: "Gemma 4 31B (gratis)" },
  { id: "nvidia/nemotron-3-super-120b-a12b:free", label: "Nemotron 3 Super (gratis)" },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", label: "Nemotron 3 Ultra (gratis)" },
  { id: "nvidia/nemotron-3.5-lightning:free", label: "Nemotron 3.5 Lightning (gratis)" },
  { id: "minimax/minimax-m3:free", label: "MiniMax M3 (gratis)" },
  { id: "minimax/minimax-m2.7:free", label: "MiniMax M2.7 (gratis)" },
  { id: "thinkingmachines/inkling:free", label: "Inkling (gratis)" },
  { id: "thinkingmachines/inkling-small:free", label: "Inkling Small (gratis)" },
];

export const ZEN_FREE_MODELS: FreeModel[] = [
  { id: "mimo-v2.5-free", label: "MiMo V2.5 (gratis)" },
  { id: "ling-3.0-flash-fin-free", label: "Ling 3.0 Flash Fin (gratis)" },
  { id: "nemotron-3-ultra-free", label: "Nemotron 3 Ultra (gratis)" },
  { id: "nemotron-3.5-lightning-free", label: "Nemotron 3.5 Lightning (gratis)" },
];

// true si el fallo es del proveedor (nunca de la clave): 404 modelo rotado,
// 429 limite, 402, 5xx, saturacion. 401 no entra.
export function isProviderSideError(error: any): boolean {
  const s = String((error && (error as any).message) || error);
  if (/(^|[^0-9])401([^0-9]|$)/.test(s) || /unauthorized|authentication/i.test(s)) {
    return false;
  }
  return (
    /(^|[^0-9])404([^0-9]|$)/.test(s) ||
    /(^|[^0-9])429([^0-9]|$)/.test(s) ||
    /(^|[^0-9])402([^0-9]|$)/.test(s) ||
    /(^|[^0-9])5[0-9]{2}([^0-9]|$)/.test(s) ||
    /provider returned error|overloaded|capacity|no endpoints|rate.?limit|payment|credits|insufficient/i.test(s)
  );
}

// Elige otro modelo gratis distinto al fallido, o null si no aplica.
// Jamas rota modelos de pago. baseURL decide la lista (OpenRouter vs Zen).
export function pickFreeFallback(
  model: any,
  baseURL: any,
  error: any
): string | null {
  const base = String(baseURL || "");
  const isZen = base.includes("opencode.ai/zen");
  const isOpenRouter = base.includes("openrouter");
  if (!/[:-]free$/.test(String(model || ""))) return null;
  if (!isZen && !isOpenRouter) return null;
  if (!isProviderSideError(error)) return null;
  const pool = isZen ? ZEN_FREE_MODELS : OPENROUTER_FREE_MODELS;
  const next = pool.find((m) => m.id !== model);
  return next ? next.id : null;
}
