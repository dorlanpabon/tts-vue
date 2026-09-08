import { describe, expect, it } from "vitest";
import {
  classifyTtsError,
  errText,
  isQuotaError,
} from "./ttsErrors";

describe("errText", () => {
  it("usa message y agrega errorDetails del SDK Azure", () => {
    expect(errText({ message: "Error", errorDetails: "401 bad" })).toContain(
      "401 bad"
    );
  });
  it("serializa objetos sin message", () => {
    expect(errText({ reason: "canceled" })).toContain("canceled");
  });
  it("null seguro", () => {
    expect(errText(null)).toBe("");
  });
});

describe("classifyTtsError", () => {
  it("429 en cualquiera de sus formas", () => {
    expect(classifyTtsError("Request failed with status code 429")).toBe(
      "rateLimited"
    );
    expect(classifyTtsError("TTS_RATE_LIMITED: x")).toBe("rateLimited");
    expect(classifyTtsError({ message: "TooManyRequests" })).toBe(
      "rateLimited"
    );
  });
  it("403 y denegados", () => {
    expect(classifyTtsError("Unexpected server response: 403")).toBe(
      "accessDenied"
    );
    expect(classifyTtsError("TTS_ACCESS_DENIED: x")).toBe("accessDenied");
  });
  it("fallos Azure nunca son cuota", () => {
    expect(classifyTtsError("TTS_AZURE_FAILED: 401 Unauthorized")).toBe(
      "azureFailed"
    );
    expect(
      classifyTtsError({ errorDetails: "401 Unauthorized: invalid key" })
    ).toBe("azureFailed");
  });
  it("otros errores", () => {
    expect(classifyTtsError("timeout of 1500ms exceeded")).toBe("other");
    expect(isQuotaError("timeout")).toBe(false);
    expect(isQuotaError("Request failed with status code 429")).toBe(true);
  });
});
