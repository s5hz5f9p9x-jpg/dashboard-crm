import { describe, expect, it } from "vitest";
import { calcularTasasDerivadas } from "./metricas";

function base(overrides: Partial<Parameters<typeof calcularTasasDerivadas>[0]> = {}) {
  return {
    leadsCaptados: 20,
    leadsCalificados: 10,
    llamadasAgendadas: 8,
    llamadasRealizadas: 6,
    clientesNuevos: 2,
    inversionPublicitariaUsd: 1000,
    ...overrides,
  };
}

describe("calcularTasasDerivadas", () => {
  it("calcula las cinco tasas con datos normales", () => {
    const r = calcularTasasDerivadas(base());
    expect(r.tasaCalificacion).toBeCloseTo(0.5, 5); // 10/20
    expect(r.tasaAsistencia).toBeCloseTo(0.75, 5); // 6/8
    expect(r.tasaCierre).toBeCloseTo(1 / 3, 5); // 2/6
    expect(r.costoLeadCalificado).toBeCloseTo(100, 5); // 1000/10
    expect(r.cacCanalPago).toBeCloseTo(500, 5); // 1000/2
  });

  it("ninguna división explota con denominador cero — todas dan null (se muestra — en la UI)", () => {
    const r = calcularTasasDerivadas(
      base({ leadsCaptados: 0, llamadasAgendadas: 0, llamadasRealizadas: 0, leadsCalificados: 0, clientesNuevos: 0 }),
    );
    expect(r.tasaCalificacion).toBeNull();
    expect(r.tasaAsistencia).toBeNull();
    expect(r.tasaCierre).toBeNull();
    expect(r.costoLeadCalificado).toBeNull();
    expect(r.cacCanalPago).toBeNull();
    // ninguno es NaN ni Infinity
    for (const v of Object.values(r)) {
      expect(Number.isNaN(v)).toBe(false);
      expect(v).not.toBe(Infinity);
    }
  });

  it("cero leads calificados con inversión > 0 da costo por lead null, no Infinity", () => {
    const r = calcularTasasDerivadas(base({ leadsCalificados: 0 }));
    expect(r.costoLeadCalificado).toBeNull();
  });

  it("sin inversión publicitaria el costo por lead y CAC dan 0, no null (0/N = 0)", () => {
    const r = calcularTasasDerivadas(base({ inversionPublicitariaUsd: 0 }));
    expect(r.costoLeadCalificado).toBe(0);
    expect(r.cacCanalPago).toBe(0);
  });
});
