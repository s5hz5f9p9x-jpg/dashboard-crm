import { describe, expect, it } from "vitest";
import { calcularProporcionPilares, calcularPublicadasSobreTotal } from "./contenido";

describe("calcularProporcionPilares", () => {
  it("calcula la proporción real y la compara contra el objetivo del plan", () => {
    const ideas = [
      { pilar: "traduccion" as const },
      { pilar: "traduccion" as const },
      { pilar: "traduccion" as const },
      { pilar: "traduccion" as const },
      { pilar: "termometro" as const },
      { pilar: "termometro" as const },
      { pilar: "termometro" as const },
      { pilar: "prueba" as const },
      { pilar: "prueba" as const },
      { pilar: "prueba" as const },
    ];
    const r = calcularProporcionPilares(ideas);
    const traduccion = r.find((p) => p.pilar === "traduccion")!;
    expect(traduccion.cantidad).toBe(4);
    expect(traduccion.pctReal).toBeCloseTo(0.4, 5);
    expect(traduccion.pctObjetivo).toBeCloseTo(0.4, 5);
  });

  it("no explota sin ideas (pctReal null en vez de NaN)", () => {
    const r = calcularProporcionPilares([]);
    for (const p of r) {
      expect(p.pctReal).toBeNull();
      expect(p.cantidad).toBe(0);
    }
  });

  it("siempre devuelve los 3 pilares aunque falten datos de alguno", () => {
    const r = calcularProporcionPilares([{ pilar: "prueba" }]);
    expect(r).toHaveLength(3);
    expect(r.find((p) => p.pilar === "traduccion")?.cantidad).toBe(0);
  });
});

describe("calcularPublicadasSobreTotal", () => {
  it("cuenta publicada y promocionada como publicadas", () => {
    const r = calcularPublicadasSobreTotal([
      { estado: "publicada" },
      { estado: "promocionada" },
      { estado: "escrita" },
      { estado: "pendiente" },
    ]);
    expect(r.publicadas).toBe(2);
    expect(r.total).toBe(4);
  });
});
