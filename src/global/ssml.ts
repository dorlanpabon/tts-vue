// Constructor unico de SSML (antes triplicado en store/play/MainOptions).
// Funciones puras: sin dependencias de Electron, aptas para tests.
export function ssmlLocale(voiceName: any, fallback = "es-CO"): string {
  const parts = String(voiceName || "").split("-");
  return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : fallback;
}

export function hasVoiceStyle(style: any): boolean {
  return !!style && style !== "" && style !== "General" && style !== "Default";
}

export function hasVoiceRole(role: any): boolean {
  return !!role && role !== "" && role !== "Default" && role !== "General";
}

export interface SsmlInput {
  voice: string;
  style?: string;
  role?: string;
  rate?: number;
  pitch?: number;
  text?: string;
}

// SSML completo (APIs Microsoft y Azure): voice + express-as + prosody.
export function buildSsml(input: SsmlInput): string {
  const voice = input.voice || "";
  const style = input.style || "";
  const role = input.role || "";
  const rate = input.rate || 0;
  const pitch = input.pitch || 0;
  const text = input.text || "";
  const lang = ssmlLocale(voice);
  return `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="${lang}">
        <voice name="${voice}">
            <mstts:express-as  ${hasVoiceStyle(style) ? 'style="' + style + '"' : ""
    } ${hasVoiceRole(role) ? 'role="' + role + '"' : ""}>
                <prosody rate="${rate}%" pitch="${pitch}%">
                ${text}
                </prosody>
            </mstts:express-as>
        </voice>
    </speak>
    `;
}

// SSML simple (API Edge): voice + prosody, sin estilos ni roles.
export function buildSsmlEdge(input: SsmlInput): string {
  const voice = input.voice || "";
  const rate = input.rate || 0;
  const pitch = input.pitch || 0;
  const text = input.text || "";
  const lang = ssmlLocale(voice);
  return `
    <speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="${lang}">
        <voice name="${voice}">
            <prosody rate="${rate}%" pitch="${pitch}%">
            ${text}
            </prosody>
        </voice>
    </speak>
    `;
}
