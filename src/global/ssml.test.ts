import { describe, expect, it } from "vitest";
import {
  buildSsml,
  buildSsmlEdge,
  hasVoiceRole,
  hasVoiceStyle,
  ssmlLocale,
} from "./ssml";

describe("ssmlLocale", () => {
  it("extrae es-CO de es-CO-SalomeNeural", () => {
    expect(ssmlLocale("es-CO-SalomeNeural")).toBe("es-CO");
  });
  it("extrae en-US de en-US-JennyNeural", () => {
    expect(ssmlLocale("en-US-JennyNeural")).toBe("en-US");
  });
  it("ignora el sufijo HD con dos puntos (Dalia DragonHD -> es-MX)", () => {
    expect(ssmlLocale("es-MX-Dalia:DragonHDLatestNeural")).toBe("es-MX");
    expect(ssmlLocale("es-ES-Ximena:DragonHDLatestNeural")).toBe("es-ES");
    expect(ssmlLocale("es-MX-Alejo:MAI-Voice-2-Flash")).toBe("es-MX");
  });
  it("usa es-CO por defecto con voz vacia", () => {
    expect(ssmlLocale("")).toBe("es-CO");
    expect(ssmlLocale(null)).toBe("es-CO");
  });
});

describe("hasVoiceStyle / hasVoiceRole", () => {
  it("vacio, General y Default son sin-estilo", () => {
    expect(hasVoiceStyle("")).toBe(false);
    expect(hasVoiceStyle("General")).toBe(false);
    expect(hasVoiceStyle("Default")).toBe(false);
    expect(hasVoiceRole("")).toBe(false);
    expect(hasVoiceRole("General")).toBe(false);
    expect(hasVoiceRole("Default")).toBe(false);
  });
  it("estilos/roles reales pasan", () => {
    expect(hasVoiceStyle("cheerful")).toBe(true);
    expect(hasVoiceRole("Narrator")).toBe(true);
  });
});

describe("buildSsml", () => {
  it("Salome sin estilo/rol: xml:lang es-CO y sin atributos vacios", () => {
    const out = buildSsml({
      voice: "es-CO-SalomeNeural",
      style: "",
      role: "Default",
      rate: 0,
      pitch: 0,
      text: "Hola",
    });
    expect(out).toContain('xml:lang="es-CO"');
    expect(out).toContain('<voice name="es-CO-SalomeNeural">');
    expect(out).not.toContain('style=""');
    expect(out).not.toContain('role=""');
    expect(out).not.toContain('style="Default"');
  });
  it("con estilo y rol los emite", () => {
    const out = buildSsml({
      voice: "en-US-JennyNeural",
      style: "cheerful",
      role: "Narrator",
      rate: 10,
      pitch: 5,
      text: "Hi",
    });
    expect(out).toContain('xml:lang="en-US"');
    expect(out).toContain('style="cheerful"');
    expect(out).toContain('role="Narrator"');
  });
});

describe("buildSsmlEdge", () => {
  it("no incluye express-as", () => {
    const out = buildSsmlEdge({
      voice: "es-CO-GonzaloNeural",
      rate: 0,
      pitch: 0,
      text: "Hola",
    });
    expect(out).toContain('xml:lang="es-CO"');
    expect(out).not.toContain("express-as");
  });
});
