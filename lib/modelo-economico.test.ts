import { describe, expect, it } from "vitest";
import { calcularModeloEconomico } from "./modelo-economico";

function base(overrides: Partial<Parameters<typeof calcularModeloEconomico>[0]> = {}) {
  return {
    aumPromedio: 100_000,
    feeAnualPct: 1.25,
    retencionAnualSupuestoPct: 85,
    retencionRealPct: null as number | null,
    multiploLtvCac: 3,
    inversionPublicitariaTotalUsd: 5_000,
    clientesNuevosPeriodo: 10,
    ...overrides,
  };
}

describe("calcularModeloEconomico", () => {
  it("usa el supuesto de configuración cuando no hay retención real (marca retencionEsSupuesto)", () => {
    const r = calcularModeloEconomico(base());
    expect(r.retencionEsSupuesto).toBe(true);
    expect(r.retencionUsada).toBeCloseTo(0.85, 5);
  });

  it("usa la retención real cuando hay 12 meses de historia, y no el supuesto", () => {
    const r = calcularModeloEconomico(base({ retencionRealPct: 92 }));
    expect(r.retencionEsSupuesto).toBe(false);
    expect(r.retencionUsada).toBeCloseTo(0.92, 5);
  });

  it("calcula ingreso anual = aum_promedio × fee", () => {
    const r = calcularModeloEconomico(base({ aumPromedio: 100_000, feeAnualPct: 1.25 }));
    expect(r.ingresoAnual).toBeCloseTo(1_250, 5);
  });

  it("calcula LTV = ingreso_anual × vida_media, con vida_media = 1/(1-retencion)", () => {
    const r = calcularModeloEconomico(base({ aumPromedio: 100_000, feeAnualPct: 1.25, retencionRealPct: 80 }));
    // vida_media = 1/(1-0.8) = 5
    expect(r.vidaMediaAnios).toBeCloseTo(5, 5);
    expect(r.ltv).toBeCloseTo(1_250 * 5, 5);
  });

  it("cac_maximo = ltv / multiplo", () => {
    const r = calcularModeloEconomico(base({ multiploLtvCac: 3 }));
    expect(r.cacMaximo).toBeCloseTo(r.ltv / 3, 5);
  });

  it("no explota con retención de 100% (vida media no puede ser infinita)", () => {
    const r = calcularModeloEconomico(base({ retencionRealPct: 100 }));
    expect(Number.isFinite(r.vidaMediaAnios)).toBe(true);
    expect(Number.isFinite(r.ltv)).toBe(true);
  });

  it("cac_real es null (—) si no hay clientes nuevos en el período, no Infinity", () => {
    const r = calcularModeloEconomico(base({ clientesNuevosPeriodo: 0 }));
    expect(r.cacReal).toBeNull();
    expect(r.puedeEscalar).toBeNull();
  });

  it("puedeEscalar es true cuando cac_real <= cac_maximo", () => {
    const r = calcularModeloEconomico(base({ inversionPublicitariaTotalUsd: 10, clientesNuevosPeriodo: 10 }));
    expect(r.cacReal).toBeCloseTo(1, 5);
    expect(r.puedeEscalar).toBe(true);
  });

  it("puedeEscalar es false cuando cac_real > cac_maximo", () => {
    const r = calcularModeloEconomico(base({ inversionPublicitariaTotalUsd: 1_000_000, clientesNuevosPeriodo: 1 }));
    expect(r.puedeEscalar).toBe(false);
  });
});
