import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { firmaValida, extraerLeads, mapearCamposLead } from "./webhook";

const SECRETO = "app-secret-de-prueba";
function firmar(cuerpo: string, secreto = SECRETO): string {
  return "sha256=" + crypto.createHmac("sha256", secreto).update(cuerpo).digest("hex");
}

describe("firmaValida", () => {
  const cuerpo = JSON.stringify({ object: "page", entry: [] });

  it("acepta una firma correcta", () => {
    expect(firmaValida(cuerpo, firmar(cuerpo), SECRETO)).toBe(true);
  });

  it("rechaza si el cuerpo fue modificado", () => {
    expect(firmaValida(cuerpo + " ", firmar(cuerpo), SECRETO)).toBe(false);
  });

  it("rechaza una firma hecha con otro secreto", () => {
    expect(firmaValida(cuerpo, firmar(cuerpo, "otro"), SECRETO)).toBe(false);
  });

  it("rechaza cuando falta la cabecera", () => {
    expect(firmaValida(cuerpo, null, SECRETO)).toBe(false);
    expect(firmaValida(cuerpo, "", SECRETO)).toBe(false);
  });

  it("rechaza otro algoritmo", () => {
    const sha1 = "sha1=" + crypto.createHmac("sha1", SECRETO).update(cuerpo).digest("hex");
    expect(firmaValida(cuerpo, sha1, SECRETO)).toBe(false);
  });

  it("rechaza basura que no es hexadecimal", () => {
    expect(firmaValida(cuerpo, "sha256=no-es-hex", SECRETO)).toBe(false);
    expect(firmaValida(cuerpo, "sha256=", SECRETO)).toBe(false);
  });

  it("rechaza si no hay app secret configurado", () => {
    expect(firmaValida(cuerpo, firmar(cuerpo), "")).toBe(false);
  });
});

describe("extraerLeads", () => {
  it("saca el lead de una notificación típica", () => {
    const leads = extraerLeads({
      object: "page",
      entry: [
        {
          changes: [
            {
              field: "leadgen",
              value: { leadgen_id: "1234567890123456", form_id: "777", ad_id: "888", created_time: 1790856000 },
            },
          ],
        },
      ],
    });
    expect(leads).toHaveLength(1);
    expect(leads[0].leadgenId).toBe("1234567890123456");
    expect(leads[0].formId).toBe("777");
    expect(leads[0].adId).toBe("888");
    expect(leads[0].creadoEn?.toISOString()).toBe("2026-10-01T12:00:00.000Z");
  });

  it("toma varios leads de una misma notificación", () => {
    const leads = extraerLeads({
      entry: [
        { changes: [{ field: "leadgen", value: { leadgen_id: "1" } }] },
        { changes: [{ field: "leadgen", value: { leadgen_id: "2" } }, { field: "leadgen", value: { leadgen_id: "3" } }] },
      ],
    });
    expect(leads.map((l) => l.leadgenId)).toEqual(["1", "2", "3"]);
  });

  it("ignora cambios que no son de leadgen", () => {
    expect(extraerLeads({ entry: [{ changes: [{ field: "feed", value: { leadgen_id: "1" } }] }] })).toEqual([]);
  });

  it("ignora entradas sin leadgen_id", () => {
    expect(extraerLeads({ entry: [{ changes: [{ field: "leadgen", value: {} }] }] })).toEqual([]);
  });

  it("no explota con cuerpos inesperados", () => {
    expect(extraerLeads({})).toEqual([]);
    expect(extraerLeads(null)).toEqual([]);
    expect(extraerLeads("texto")).toEqual([]);
    expect(extraerLeads({ entry: "no es lista" })).toEqual([]);
  });
});

describe("mapearCamposLead", () => {
  it("lee los campos estándar de Meta", () => {
    expect(
      mapearCamposLead([
        { name: "full_name", values: ["Juan Pérez"] },
        { name: "email", values: ["juan@ejemplo.com"] },
        { name: "phone_number", values: ["+5491137751234"] },
      ]),
    ).toEqual({ nombre: "Juan Pérez", email: "juan@ejemplo.com", telefono: "+5491137751234" });
  });

  it("arma el nombre desde first_name y last_name", () => {
    expect(
      mapearCamposLead([
        { name: "first_name", values: ["Juan"] },
        { name: "last_name", values: ["Pérez"] },
      ]).nombre,
    ).toBe("Juan Pérez");
  });

  it("reconoce campos con nombres en español", () => {
    const r = mapearCamposLead([
      { name: "nombre_completo", values: ["Ana Gómez"] },
      { name: "correo_electronico", values: ["ana@ejemplo.com"] },
      { name: "telefono_celular", values: ["1155556666"] },
    ]);
    expect(r).toEqual({ nombre: "Ana Gómez", email: "ana@ejemplo.com", telefono: "1155556666" });
  });

  it("devuelve null en lo que falta en vez de inventar", () => {
    expect(mapearCamposLead([{ name: "email", values: ["a@b.com"] }])).toEqual({
      nombre: null,
      email: "a@b.com",
      telefono: null,
    });
  });

  it("ignora valores vacíos", () => {
    expect(mapearCamposLead([{ name: "email", values: ["   "] }]).email).toBeNull();
    expect(mapearCamposLead([{ name: "email", values: [] }]).email).toBeNull();
  });
});
