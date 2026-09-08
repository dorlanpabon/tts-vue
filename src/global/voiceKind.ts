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

export interface VoiceEntry {
  shortName?: string;
  locale?: string;
  [key: string]: any;
}

// Union por shortName: lo vivo manda, el fallback rellena lo que falte
// (cache vieja, lista rotada u offline). Nunca duplica.
export function mergeVoiceLists(primary: any, fallback: any): VoiceEntry[] {
  const out: VoiceEntry[] = [];
  const seen = new Set<string>();
  for (const source of [primary, fallback]) {
    if (!Array.isArray(source)) continue;
    for (const v of source) {
      const sn = String((v && (v.shortName || (v.properties && v.properties.ShortName))) || "");
      if (sn === "" || seen.has(sn)) continue;
      seen.add(sn);
      out.push(v);
    }
  }
  return out;
}
