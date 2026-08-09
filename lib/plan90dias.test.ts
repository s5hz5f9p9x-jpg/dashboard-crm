import { describe, expect, it } from "vitest";
import { calcularAvance, calcularBloqueoFases } from "./plan90dias";

describe("calcularBloqueoFases", () => {
  it("la fase 0 nunca está bloqueada", () => {
    const r = calcularBloqueoFases([]);
    expect(r.fase_0.bloqueada).toBe(false);
  });

  it("la fase 1 está bloqueada si la condición de salida de la fase 0 no está hecha", () => {
    const tareas = [{ fase: "fase_0" as const, es_condicion_salida: true, estado: "pendiente" as const }];
    const r = calcularBloqueoFases(tareas);
    expect(r.fase_1.bloqueada).toBe(true);
    expect(r.fase_1.motivo).toMatch(/condición de salida/i);
  });

  it("la fase 1 se desbloquea cuando la condición de salida de la fase 0 está hecha", () => {
    const tareas = [{ fase: "fase_0" as const, es_condicion_salida: true, estado: "hecho" as const }];
    const r = calcularBloqueoFases(tareas);
    expect(r.fase_1.bloqueada).toBe(false);
    expect(r.fase_1.motivo).toBeNull();
  });

  it("cada fase depende solo de la condición de la fase inmediatamente anterior", () => {
    const tareas = [
      { fase: "fase_0" as const, es_condicion_salida: true, estado: "hecho" as const },
      { fase: "fase_1" as const, es_condicion_salida: true, estado: "pendiente" as const },
    ];
    const r = calcularBloqueoFases(tareas);
    expect(r.fase_1.bloqueada).toBe(false); // depende de fase_0, que está hecha
    expect(r.fase_2.bloqueada).toBe(true); // depende de fase_1, que no está hecha
  });

  it("si no hay tarea de condición de salida para la fase anterior, se trata como no cumplida", () => {
    const r = calcularBloqueoFases([]);
    expect(r.fase_1.bloqueada).toBe(true);
  });
});

describe("calcularAvance", () => {
  it("calcula el porcentaje sobre las tareas aplicables, ignorando no_aplica", () => {
    const r = calcularAvance([
      { estado: "hecho" },
      { estado: "hecho" },
      { estado: "pendiente" },
      { estado: "no_aplica" },
    ]);
    expect(r.hechas).toBe(2);
    expect(r.total).toBe(3);
    expect(r.pct).toBeCloseTo(2 / 3, 5);
  });

  it("no explota con lista vacía", () => {
    const r = calcularAvance([]);
    expect(r.pct).toBe(0);
    expect(r.total).toBe(0);
  });

  it("100% cuando todas están hechas", () => {
    const r = calcularAvance([{ estado: "hecho" }, { estado: "hecho" }]);
    expect(r.pct).toBe(1);
  });
});
