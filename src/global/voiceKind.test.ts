import { describe, expect, it } from "vitest";
import { hdLocales, isHdVoice, mergeVoiceLists } from "./voiceKind";

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

describe("mergeVoiceLists", () => {
  const live = [
    { shortName: "es-CO-SalomeNeural", locale: "es-CO", properties: { ShortName: "es-CO-SalomeNeural" } },
    { shortName: "es-MX-Dalia:DragonHDLatestNeural", locale: "es-MX", properties: { ShortName: "es-MX-Dalia:DragonHDLatestNeural" } },
  ];
  const fallback = [
    { shortName: "es-CO-SalomeNeural", locale: "es-CO", properties: { ShortName: "es-CO-SalomeNeural" } },
    { shortName: "es-ES-Ximena:DragonHDLatestNeural", locale: "es-ES", properties: { ShortName: "es-ES-Ximena:DragonHDLatestNeural" } },
  ];
  it("lo vivo manda y el fallback rellena sin duplicar", () => {
    const merged = mergeVoiceLists(live, fallback);
    const names = merged.map((v) => v.shortName);
    expect(names).toEqual([
      "es-CO-SalomeNeural",
      "es-MX-Dalia:DragonHDLatestNeural",
      "es-ES-Ximena:DragonHDLatestNeural",
    ]);
  });
  it("cache corrupta o vacia cae al fallback", () => {
    expect(mergeVoiceLists(null as any, fallback).length).toBe(2);
    expect(mergeVoiceLists([] as any, fallback).length).toBe(2);
    expect(mergeVoiceLists("basura" as any, fallback).length).toBe(2);
  });
});
