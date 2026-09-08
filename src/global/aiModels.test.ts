import { describe, expect, it } from "vitest";
import {
  OPENROUTER_FREE_MODELS,
  ZEN_FREE_MODELS,
  pickFreeFallback,
} from "./aiModels";

const OR = "https://openrouter.ai/api/v1";
const ZEN = "https://opencode.ai/zen/v1";
const OAI = "https://api.openai.com/v1";

describe("pickFreeFallback", () => {
  it("OpenRouter :free con fallo de proveedor rota a otro gratis", () => {
    expect(
      pickFreeFallback(
        "google/gemma-4-31b-it:free",
        OR,
        "Provider returned error"
      )
    ).toBe("nvidia/nemotron-3-super-120b-a12b:free");
  });
  it("Zen -free con 429 rota dentro de Zen", () => {
    expect(pickFreeFallback("mimo-v2.5-free", ZEN, "429 slow down")).toBe(
      "ling-3.0-flash-fin-free"
    );
  });
  it("401 nunca rota", () => {
    expect(pickFreeFallback("mimo-v2.5-free", ZEN, "401 Invalid API key.")).toBe(
      null
    );
    expect(
      pickFreeFallback("google/gemma-4-31b-it:free", OR, "401 Unauthorized")
    ).toBe(null);
  });
  it("modelos de pago y otros proveedores no rotan", () => {
    expect(pickFreeFallback("gpt-4o-mini", OAI, "Provider returned error")).toBe(
      null
    );
    expect(
      pickFreeFallback("mimo-v2.5-free", OAI, "Provider returned error")
    ).toBe(null);
    expect(
      pickFreeFallback("muse-spark-1.3", ZEN, "Provider returned error")
    ).toBe(null);
  });
  it("402/503 de gratis si rotan", () => {
    expect(
      pickFreeFallback("google/gemma-4-31b-it:free", OR, "402 Payment Required")
    ).not.toBe(null);
  });
});

describe("listas de modelos gratis", () => {
  it("OpenRouter y Zen no estan vacias y no se solapan", () => {
    expect(OPENROUTER_FREE_MODELS.length).toBeGreaterThan(0);
    expect(ZEN_FREE_MODELS.length).toBeGreaterThan(0);
    const orIds = new Set(OPENROUTER_FREE_MODELS.map((m) => m.id));
    for (const m of ZEN_FREE_MODELS) {
      expect(orIds.has(m.id)).toBe(false);
    }
  });
});
