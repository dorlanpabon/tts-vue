// Clasificacion de voces por familia. Puro y testeable.
const HD_PATTERN = /Dragon|MAI-Voice/i;

// true para voces neurales HD: Dragon* (HD/Omni/Flash) y MAI-Voice-*.
// Las MultilingualNeural son generacion anterior: no cuentan como HD.
export function isHdVoice(shortName: any): boolean {
  return HD_PATTERN.test(String(shortName || ""));
}
