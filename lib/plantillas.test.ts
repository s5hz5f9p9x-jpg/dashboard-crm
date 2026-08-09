import { describe, expect, it } from "vitest";
import { construirLinkWhatsapp, renderPlantilla } from "./plantillas";

describe("renderPlantilla", () => {
  it("reemplaza {nombre} en pedir_referido", () => {
    const r = renderPlantilla("pedir_referido", { nombre: "Pablo" });
    expect(r).toContain("Hola Pablo,");
    expect(r).not.toContain("{nombre}");
  });

  it("reemplaza {nombre} y {años} en aniversario", () => {
    const r = renderPlantilla("aniversario", { nombre: "Ana", años: 3 });
    expect(r).toContain("Hola Ana,");
    expect(r).toContain("se cumplen 3 año/s");
  });

  it("deja el placeholder si falta la variable", () => {
    const r = renderPlantilla("aniversario", { nombre: "Ana" });
    expect(r).toContain("{años}");
  });

  it("contacto_vencido no tiene variables además de nombre", () => {
    const r = renderPlantilla("contacto_vencido", { nombre: "Juan" });
    expect(r).toContain("Hola Juan,");
  });
});

describe("construirLinkWhatsapp", () => {
  it("arma un link wa.me con el teléfono limpio y el mensaje codificado", () => {
    const link = construirLinkWhatsapp("+5491112345678", "Hola!");
    expect(link).toBe("https://wa.me/+5491112345678?text=Hola!");
  });

  it("limpia espacios y guiones del teléfono", () => {
    const link = construirLinkWhatsapp("11 1234-5678", "test");
    expect(link).toBe("https://wa.me/1112345678?text=test");
  });

  it("codifica el mensaje para la URL", () => {
    const link = construirLinkWhatsapp("1234", "Hola, ¿cómo va?");
    expect(link).toContain("text=" + encodeURIComponent("Hola, ¿cómo va?"));
  });
});
