import { describe, expect, it } from "vitest";
import { isHdVoice } from "./voiceKind";

describe("isHdVoice", () => {
  it("detecta DragonHD/Omni/Flash y MAI-Voice", () => {
    for (const v of [
      "es-MX-Dalia:DragonHDLatestNeural",
      "es-ES-Ximena:DragonHDLatestNeural",
      "en-US-Ava:DragonHDOmniLatestNeural",
      "en-US-Jimmie:DragonHDFlashLatestNeural",
      "es-MX-Alejo:MAI-Voice-2",
      "es-ES-Marta:MAI-Voice-2-Flash",
    ]) {
      expect(isHdVoice(v)).toBe(true);
    }
  });
  it("rechaza Neural estandar, Multilingual y vacios", () => {
    for (const v of [
      "es-CO-SalomeNeural",
      "es-MX-DaliaNeural",
      "es-MX-DaliaMultilingualNeural",
      "",
      null,
      undefined,
    ]) {
      expect(isHdVoice(v)).toBe(false);
    }
  });
});
