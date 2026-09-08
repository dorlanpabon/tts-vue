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
  it("las HD/MAI espanolas cuelgan de es-MX / es-ES", () => {
    // Sintaxis con ":" es propia de DragonHD/MAI-Voice: 4 DragonHD + 6 MAI.
    // (Las 6 Multilingual no llevan ":" y se verifican en el test anterior.)
    const hd = (voices as any[]).filter((v) => v.shortName.includes(":"));
    expect(hd.length).toBeGreaterThanOrEqual(10);
    for (const v of hd) {
      expect(["es-MX", "es-ES"]).toContain(v.locale);
    }
  });
});
