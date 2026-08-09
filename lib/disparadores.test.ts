import { describe, expect, it } from "vitest";
import {
  evaluarAniversario,
  evaluarContactoVencido,
  evaluarInactividadProlongada,
  evaluarPedirReferido,
  evaluarVariacionAum,
  evaluarVencimientoProximo,
  periodoMes,
} from "./disparadores";

describe("evaluarVariacionAum", () => {
  it("dispara con una suba mayor al umbral", () => {
    const r = evaluarVariacionAum(120_000, 100_000, 10);
    expect(r.disparar).toBe(true);
    expect(r.variacionPct).toBeCloseTo(20, 5);
  });

  it("dispara con una baja mayor al umbral (en valor absoluto)", () => {
    const r = evaluarVariacionAum(80_000, 100_000, 10);
    expect(r.disparar).toBe(true);
    expect(r.variacionPct).toBeCloseTo(-20, 5);
  });

  it("no dispara con una variación dentro del umbral", () => {
    const r = evaluarVariacionAum(105_000, 100_000, 10);
    expect(r.disparar).toBe(false);
  });

  it("no dispara si no hay dato de hace un mes", () => {
    const r = evaluarVariacionAum(100_000, null, 10);
    expect(r.disparar).toBe(false);
    expect(r.variacionPct).toBeNull();
  });

  it("no explota con AUM de referencia en cero (evita división por cero)", () => {
    const r = evaluarVariacionAum(100_000, 0, 10);
    expect(r.disparar).toBe(false);
  });
});

describe("evaluarContactoVencido", () => {
  it("dispara por encima de la frecuencia", () => {
    expect(evaluarContactoVencido(31, 30)).toBe(true);
  });
  it("no dispara en la frecuencia exacta", () => {
    expect(evaluarContactoVencido(30, 30)).toBe(false);
  });
  it("no dispara por debajo de la frecuencia", () => {
    expect(evaluarContactoVencido(10, 30)).toBe(false);
  });
});

describe("evaluarInactividadProlongada", () => {
  it("dispara por encima del umbral de inactividad", () => {
    expect(evaluarInactividadProlongada(61, 60)).toBe(true);
  });
  it("no dispara en el umbral exacto", () => {
    expect(evaluarInactividadProlongada(60, 60)).toBe(false);
  });
});

describe("evaluarAniversario", () => {
  it("detecta el aniversario exacto", () => {
    const r = evaluarAniversario("2023-08-06", new Date("2026-08-06T00:00:00"));
    expect(r.esAniversario).toBe(true);
    expect(r.anios).toBe(3);
  });

  it("no dispara un día distinto", () => {
    const r = evaluarAniversario("2023-08-06", new Date("2026-08-07T00:00:00"));
    expect(r.esAniversario).toBe(false);
  });

  it("no dispara el mismo día del alta (0 años)", () => {
    const r = evaluarAniversario("2026-08-06", new Date("2026-08-06T00:00:00"));
    expect(r.esAniversario).toBe(false);
    expect(r.anios).toBe(0);
  });
});

describe("evaluarPedirReferido", () => {
  it("no dispara antes de las 48hs", () => {
    const reporte = new Date("2026-08-06T10:00:00");
    const hoy = new Date("2026-08-08T09:00:00"); // 47hs
    expect(evaluarPedirReferido(reporte, hoy)).toBe(false);
  });

  it("dispara a partir de las 48hs", () => {
    const reporte = new Date("2026-08-06T10:00:00");
    const hoy = new Date("2026-08-08T10:00:00"); // exacto 48hs
    expect(evaluarPedirReferido(reporte, hoy)).toBe(true);
  });

  it("sigue disparando bastante después de las 48hs", () => {
    const reporte = new Date("2026-08-01T10:00:00");
    const hoy = new Date("2026-08-08T10:00:00");
    expect(evaluarPedirReferido(reporte, hoy)).toBe(true);
  });
});

describe("evaluarVencimientoProximo", () => {
  it("dispara dentro de la ventana de 30 días", () => {
    expect(evaluarVencimientoProximo("2026-09-01", new Date("2026-08-06T00:00:00"))).toBe(true);
  });
  it("no dispara fuera de la ventana", () => {
    expect(evaluarVencimientoProximo("2026-12-01", new Date("2026-08-06T00:00:00"))).toBe(false);
  });
  it("no dispara con vencimiento ya pasado", () => {
    expect(evaluarVencimientoProximo("2026-08-01", new Date("2026-08-06T00:00:00"))).toBe(false);
  });
  it("dispara el mismo día del vencimiento", () => {
    expect(evaluarVencimientoProximo("2026-08-06", new Date("2026-08-06T00:00:00"))).toBe(true);
  });
});

describe("periodoMes", () => {
  it("formatea como YYYY-MM", () => {
    expect(periodoMes(new Date("2026-08-06T00:00:00"))).toBe("2026-08");
    expect(periodoMes(new Date("2026-01-06T00:00:00"))).toBe("2026-01");
  });
});
