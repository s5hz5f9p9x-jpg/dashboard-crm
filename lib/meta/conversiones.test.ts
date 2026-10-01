import { describe, expect, it } from "vitest";
import { construirPayload, hashEmail, hashTelefono, EVENTO_POR_ETAPA } from "./conversiones";

describe("hashEmail", () => {
  it("normaliza a minúscula y recorta espacios antes de hashear", () => {
    expect(hashEmail("  John_Smith@GMAIL.com ")).toBe(hashEmail("john_smith@gmail.com"));
  });

  it("devuelve un SHA-256 en hexadecimal", () => {
    expect(hashEmail("john_smith@gmail.com")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("devuelve null si no hay email", () => {
    expect(hashEmail(null)).toBeNull();
    expect(hashEmail("")).toBeNull();
    expect(hashEmail("   ")).toBeNull();
  });
});

describe("hashTelefono", () => {
  it("deja sólo dígitos", () => {
    expect(hashTelefono("+54 9 11 3775-1234")).toBe(hashTelefono("5491137751234"));
  });

  it("saca los ceros a la izquierda", () => {
    expect(hashTelefono("0054911")).toBe(hashTelefono("54911"));
  });

  it("devuelve null sin teléfono", () => {
    expect(hashTelefono(null)).toBeNull();
    expect(hashTelefono("sin numero")).toBeNull();
  });
});

describe("construirPayload", () => {
  const base = { leadId: "1234567890123456", etapa: "ganado" as const, ocurridoEn: new Date("2026-10-01T12:00:00Z") };

  it("arma el evento con la forma que exige Meta", () => {
    const p = construirPayload([base]);
    const e = p.data[0];
    expect(e.event_name).toBe("converted");
    expect(e.action_source).toBe("system_generated");
    expect(e.custom_data.event_source).toBe("crm");
    expect(e.event_time).toBe(Math.floor(Date.UTC(2026, 9, 1, 12, 0, 0) / 1000));
  });

  it("manda el lead_id sin hashear: es un identificador de Meta, no un dato personal", () => {
    const e = construirPayload([base]).data[0];
    expect(e.user_data.lead_id).toBe("1234567890123456");
  });

  it("incluye email y teléfono hasheados cuando están", () => {
    const e = construirPayload([{ ...base, email: "a@b.com", telefonoE164: "5491137751234" }]).data[0];
    expect(e.user_data.em).toEqual([hashEmail("a@b.com")]);
    expect(e.user_data.ph).toEqual([hashTelefono("5491137751234")]);
  });

  it("omite email y teléfono si no hay, en vez de mandar vacíos", () => {
    const e = construirPayload([base]).data[0];
    expect(e.user_data).not.toHaveProperty("em");
    expect(e.user_data).not.toHaveProperty("ph");
  });

  it("nunca manda el email en claro", () => {
    const json = JSON.stringify(construirPayload([{ ...base, email: "secreto@cliente.com" }]));
    expect(json).not.toContain("secreto@cliente.com");
  });

  it("agrupa varios eventos en un solo pedido", () => {
    expect(construirPayload([base, { ...base, leadId: "999", etapa: "lead" }]).data).toHaveLength(2);
  });
});

describe("EVENTO_POR_ETAPA", () => {
  it("cubre las ocho etapas del pipeline", () => {
    expect(Object.keys(EVENTO_POR_ETAPA)).toHaveLength(8);
  });

  it("usa nombres estables, sin espacios ni acentos", () => {
    for (const v of Object.values(EVENTO_POR_ETAPA)) expect(v).toMatch(/^[a-z_]+$/);
  });
});
