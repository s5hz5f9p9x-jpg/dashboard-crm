import { describe, expect, it } from "vitest";
import { calcularSegmento, type SnapshotAum } from "./segmentacion";

const HOY = new Date("2026-08-06T12:00:00");
const UMBRAL_A = 100_000;
const UMBRAL_B = 40_000;
const GRACIA = 90;

function base(overrides: Partial<Parameters<typeof calcularSegmento>[0]> = {}) {
  return {
    estado: "activo" as const,
    fechaAlta: "2020-01-01",
    hoy: HOY,
    segmentoManual: null,
    segmentoManualMotivo: null,
    segmentoActual: "C" as const,
    snapshots: [] as SnapshotAum[],
    umbralSegmentoA: UMBRAL_A,
    umbralSegmentoB: UMBRAL_B,
    diasGraciaClienteNuevo: GRACIA,
    ...overrides,
  };
}

function snapshotsMensuales(valores: number[], desdeMesesAtras = 0): SnapshotAum[] {
  // genera un snapshot por mes, el más reciente primero
  return valores.map((aum_usd, i) => {
    const mes = 8 - desdeMesesAtras - i;
    const fecha = `2026-${String(mes).padStart(2, "0")}-15`;
    return { fecha, aum_usd };
  });
}

describe("calcularSegmento", () => {
  it("devuelve el override manual cuando tiene motivo", () => {
    const r = calcularSegmento(
      base({ segmentoManual: "A", segmentoManualMotivo: "Refiere mucho" }),
    );
    expect(r.segmento).toBe("A");
    expect(r.motivo).toContain("Refiere mucho");
  });

  it("explota si hay override manual sin motivo", () => {
    expect(() =>
      calcularSegmento(base({ segmentoManual: "A", segmentoManualMotivo: "" })),
    ).toThrow(/motivo/i);
    expect(() =>
      calcularSegmento(base({ segmentoManual: "A", segmentoManualMotivo: null })),
    ).toThrow(/motivo/i);
  });

  it("un cliente no activo siempre es C, sin importar el AUM", () => {
    const r = calcularSegmento(
      base({
        estado: "pausado",
        segmentoActual: "A",
        snapshots: snapshotsMensuales([500_000, 500_000, 500_000]),
      }),
    );
    expect(r.segmento).toBe("C");
  });

  it("un cliente dado de baja es C", () => {
    const r = calcularSegmento(base({ estado: "baja" }));
    expect(r.segmento).toBe("C");
  });

  it("un cliente con menos de 90 días desde el alta es C aunque tenga AUM alto", () => {
    const r = calcularSegmento(
      base({
        fechaAlta: "2026-07-15", // ~22 días antes de HOY
        snapshots: snapshotsMensuales([500_000]),
      }),
    );
    expect(r.segmento).toBe("C");
    expect(r.motivo).toMatch(/nuevo/i);
  });

  it("un cliente justo en el borde de los 90 días ya no está en gracia", () => {
    // 90 días antes de 2026-08-06 => 2026-05-08
    const r = calcularSegmento(
      base({
        fechaAlta: "2026-05-08",
        snapshots: snapshotsMensuales([500_000]),
      }),
    );
    expect(r.segmento).not.toBe("C");
  });

  it("sin ningún snapshot, cae en C con motivo explícito", () => {
    const r = calcularSegmento(base({ snapshots: [] }));
    expect(r.segmento).toBe("C");
    expect(r.motivo).toMatch(/sin historial/i);
  });

  it("promedio >= umbral A da segmento A", () => {
    const r = calcularSegmento(
      base({ segmentoActual: "C", snapshots: snapshotsMensuales([120_000, 110_000, 130_000]) }),
    );
    expect(r.segmento).toBe("A");
  });

  it("promedio entre umbral B y A da segmento B", () => {
    const r = calcularSegmento(
      base({ segmentoActual: "C", snapshots: snapshotsMensuales([50_000, 45_000, 55_000]) }),
    );
    expect(r.segmento).toBe("B");
  });

  it("promedio debajo de umbral B da segmento C", () => {
    const r = calcularSegmento(
      base({ segmentoActual: "C", snapshots: snapshotsMensuales([10_000, 15_000, 5_000]) }),
    );
    expect(r.segmento).toBe("C");
  });

  it("subir de segmento se aplica de inmediato, sin histéresis", () => {
    const r = calcularSegmento(
      base({ segmentoActual: "C", snapshots: snapshotsMensuales([120_000, 120_000, 120_000]) }),
    );
    expect(r.segmento).toBe("A");
  });

  describe("histéresis al bajar", () => {
    it("un cliente A que cae apenas debajo del umbral (pero no 10%) se mantiene en A", () => {
      // umbral A = 100k, 95k está debajo del umbral pero dentro del 10% de piso (90k)
      const r = calcularSegmento(
        base({ segmentoActual: "A", snapshots: snapshotsMensuales([95_000, 95_000, 95_000]) }),
      );
      expect(r.segmento).toBe("A");
      expect(r.motivo).toMatch(/histéresis/i);
    });

    it("un cliente A que cae más de 10% debajo del umbral sí baja", () => {
      // piso de histéresis = 90k; 85k está debajo
      const r = calcularSegmento(
        base({ segmentoActual: "A", snapshots: snapshotsMensuales([85_000, 85_000, 85_000]) }),
      );
      expect(r.segmento).toBe("B");
    });

    it("justo en el piso de histéresis (exactamente 90% del umbral) no baja", () => {
      const r = calcularSegmento(
        base({ segmentoActual: "A", snapshots: snapshotsMensuales([90_000, 90_000, 90_000]) }),
      );
      expect(r.segmento).toBe("A");
    });

    it("un cliente B que cae más de 10% debajo de su umbral baja a C", () => {
      // umbral B = 40k, piso = 36k
      const r = calcularSegmento(
        base({ segmentoActual: "B", snapshots: snapshotsMensuales([30_000, 30_000, 30_000]) }),
      );
      expect(r.segmento).toBe("C");
    });

    it("un cliente B que oscila cerca del umbral sin cruzar el piso se mantiene en B", () => {
      const r = calcularSegmento(
        base({ segmentoActual: "B", snapshots: snapshotsMensuales([38_000, 38_000, 38_000]) }),
      );
      expect(r.segmento).toBe("B");
    });
  });

  it("usa el promedio de como máximo 3 meses, tomando el snapshot más reciente de cada mes", () => {
    const snapshots: SnapshotAum[] = [
      { fecha: "2026-08-01", aum_usd: 200_000 },
      { fecha: "2026-08-15", aum_usd: 100_000 }, // el más reciente de agosto -> gana
      { fecha: "2026-07-10", aum_usd: 100_000 },
      { fecha: "2026-06-10", aum_usd: 100_000 },
      { fecha: "2026-05-10", aum_usd: 5_000 }, // mes 4, no debería contar
    ];
    const r = calcularSegmento(base({ segmentoActual: "C", snapshots }));
    // promedio esperado: (100000 + 100000 + 100000) / 3 = 100000 -> A
    expect(r.aumPromedio).toBe(100_000);
    expect(r.segmento).toBe("A");
  });
});
