import { describe, expect, it } from "vitest";
import { voices } from "./voices";

describe("voices fallback", () => {
  it("incluye las HD espanolas (Dalia/Jorge/Ximena/Tristan DragonHD)", () => {
    const names = new Set(voices.map((v: any) => v.shortName));
    for (const hd of [
      "es-MX-Dalia:DragonHDLatestNeural",
      "es-MX-Jorge:DragonHDLatestNeural",
      "es-ES-Ximena:DragonHDLatestNeural",
      "es-ES-Tristan:DragonHDLatestNeural",
      "es-MX-DaliaMultilingualNeural",
      "es-MX-Alejo:MAI-Voice-2",
    ]) {
      expect(names.has(hd)).toBe(true);
    }
  });
  it("sin shortName duplicados y con locale/properties validos", () => {
    const seen = new Set<string>();
    for (const v of voices as any[]) {
      expect(typeof v.shortName).toBe("string");
      expect(seen.has(v.shortName)).toBe(false);
      seen.add(v.shortName);
      expect(typeof v.locale).toBe("string");
      expect(typeof v.properties.ShortName).toBe("string");
      expect(typeof v.properties.DisplayName).toBe("string");
    }
  });
  it("las HD/MAI (sintaxis con ':') son globales con locale valido", () => {
    // Sintaxis con ":" es propia de DragonHD/MAI-Voice (verificado en lista viva).
    const hd = (voices as any[]).filter((v) => v.shortName.includes(":"));
    expect(hd.length).toBeGreaterThanOrEqual(200);
    for (const v of hd) {
      expect(typeof v.locale).toBe("string");
      expect(v.locale.length).toBeGreaterThan(0);
    }
  });
});
