import { describe, expect, it } from "vitest";
import { normalizarTelefono, linkWhatsApp } from "./telefono";

function e164(raw: string): string | null {
  const r = normalizarTelefono(raw);
  return r.ok ? r.e164 : null;
}

describe("normalizarTelefono", () => {
  describe("casos reales de la base", () => {
    it("celular AMBA de 10 dígitos, tal cual está cargado", () => {
      expect(e164("1137751234")).toBe("5491137751234");
    });

    it("interior con 0 y 15 (Concordia): 0345 15 4054183", () => {
      expect(e164("0345154054183")).toBe("5493454054183");
    });

    it("con guion y espacios", () => {
      expect(e164("153560-6334")).toBeNull();
    });

    it("sin código de área no se puede recuperar", () => {
      const r = normalizarTelefono("29545916");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.motivo).toMatch(/código de área/i);
    });
  });

  describe("prefijos internacionales", () => {
    it("acepta 549 ya puesto", () => {
      expect(e164("5491137751234")).toBe("5491137751234");
    });

    it("acepta 54 sin el 9", () => {
      expect(e164("541137751234")).toBe("5491137751234");
    });

    it("acepta +54 9 con formato", () => {
      expect(e164("+54 9 11 3775-1234")).toBe("5491137751234");
    });
  });

  describe("prefijo 15 en distintos largos de área", () => {
    it("área de 2 dígitos: 11 15 xxxxxxxx", () => {
      expect(e164("1115" + "37751234")).toBe("5491137751234");
    });

    it("área de 3 dígitos: 341 15 xxxxxxx", () => {
      expect(e164("341154054183")).toBe("5493414054183");
    });

    it("área de 4 dígitos: 2954 15 xxxxxx", () => {
      expect(e164("2954155916" + "12")).toBe("5492954591612");
    });
  });

  describe("rechaza lo que no puede resolver sin adivinar", () => {
    it("vacío", () => {
      expect(normalizarTelefono("").ok).toBe(false);
      expect(normalizarTelefono(null).ok).toBe(false);
      expect(normalizarTelefono(undefined).ok).toBe(false);
    });

    it("texto sin dígitos", () => {
      const r = normalizarTelefono("no tiene");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.motivo).toMatch(/dígitos/i);
    });

    it("demasiados dígitos", () => {
      expect(normalizarTelefono("11377512345678").ok).toBe(false);
    });

    it("empieza con 15, área perdida", () => {
      expect(normalizarTelefono("1535606334").ok).toBe(false);
    });

    it("código de área que no existe en Argentina (empieza en 4)", () => {
      expect(normalizarTelefono("4437751234").ok).toBe(false);
    });
  });

  it("conserva el original para poder mostrarlo al corregir", () => {
    const r = normalizarTelefono(" 011 15-3775-1234 ");
    expect(r.original).toBe("011 15-3775-1234");
  });
});

describe("linkWhatsApp", () => {
  it("arma el link con el mensaje escapado", () => {
    const link = linkWhatsApp("5491137751234", "Hola Juan, cobrás US$ 1.500 el 15/09");
    expect(link).toContain("https://wa.me/5491137751234?text=");
    expect(link).toContain("US%24%201.500");
    expect(link).not.toContain(" ");
  });
});
