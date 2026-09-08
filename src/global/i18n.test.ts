import { describe, expect, it } from "vitest";
import i18n from "../assets/i18n/i18n";

function keys(obj: any, prefix = ""): string[] {
  let out: string[] = [];
  for (const k of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (obj[k] !== null && typeof obj[k] === "object") {
      out = out.concat(keys(obj[k], path));
    } else {
      out.push(path);
    }
  }
  return out;
}

describe("i18n", () => {
  const messages: any = (i18n.global as any).messages?.value || (i18n.global as any).messages;
  const locales = Object.keys(messages);
  it("existen es, en y zh", () => {
    expect(locales).toContain("es");
    expect(locales).toContain("en");
    expect(locales).toContain("zh");
  });
  it("todas las claves de en existen en es y zh", () => {
    const base = new Set(keys(messages.en));
    for (const locale of ["es", "zh"]) {
      const have = new Set(keys(messages[locale]));
      const lacking = [...base].filter((k) => !have.has(k));
      expect(`${locale} missing: ${lacking.join(",")}`).toBe(`${locale} missing: `);
    }
  });
});
