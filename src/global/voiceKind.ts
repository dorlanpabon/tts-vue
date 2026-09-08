// Clasificacion de voces por familia. Puro y testeable.
const HD_PATTERN = /Dragon|MAI-Voice/i;

// true para voces neurales HD: Dragon* (HD/Omni/Flash) y MAI-Voice-*.
// Las MultilingualNeural son generacion anterior: no cuentan como HD.
export function isHdVoice(shortName: any): boolean {
  return HD_PATTERN.test(String(shortName || ""));
}

// Locales (en orden de aparicion) que tienen al menos una voz HD.
export function hdLocales(voices: Array<{ locale: any; ShortName: any }>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of voices || []) {
    const locale = String((v && (v as any).locale) || "");
    if (locale === "" || seen.has(locale)) continue;
    if (!isHdVoice((v as any).ShortName)) continue;
    seen.add(locale);
    out.push(locale);
  }
  return out;
}
