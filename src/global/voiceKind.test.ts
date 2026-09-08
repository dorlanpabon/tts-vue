import { describe, expect, it } from "vitest";
import { hdLocales, isHdVoice } from "./voiceKind";

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

describe("hdLocales", () => {
  const list = [
    { locale: "es-CO", ShortName: "es-CO-SalomeNeural" },
    { locale: "es-MX", ShortName: "es-MX-DaliaNeural" },
    { locale: "es-MX", ShortName: "es-MX-Dalia:DragonHDLatestNeural" },
    { locale: "es-ES", ShortName: "es-ES-Ximena:DragonHDLatestNeural" },
    { locale: "", ShortName: "es-MX-Jorge:DragonHDLatestNeural" },
    { locale: "en-US", ShortName: "" },
  ];
  it("solo locales con HD, sin duplicados y en orden", () => {
    expect(hdLocales(list)).toEqual(["es-MX", "es-ES"]);
  });
  it("lista vacia o sin HD devuelve vacio", () => {
    expect(hdLocales([])).toEqual([]);
    expect(hdLocales([{ locale: "es-CO", ShortName: "x" }])).toEqual([]);
  });
});
