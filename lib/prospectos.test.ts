import { describe, expect, it } from "vitest";
import { calcularCalificado } from "./prospectos";

describe("calcularCalificado", () => {
  it("menos_20k no califica", () => {
    expect(calcularCalificado("menos_20k")).toBe(false);
  });

  it("20k_50k califica", () => {
    expect(calcularCalificado("20k_50k")).toBe(true);
  });

  it("50k_150k califica", () => {
    expect(calcularCalificado("50k_150k")).toBe(true);
  });

  it("mas_150k califica", () => {
    expect(calcularCalificado("mas_150k")).toBe(true);
  });

  it("sin patrimonio declarado no califica (todavía no se sabe)", () => {
    expect(calcularCalificado(null)).toBe(false);
  });
});
