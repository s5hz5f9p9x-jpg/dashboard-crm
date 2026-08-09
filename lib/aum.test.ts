import { describe, expect, it } from "vitest";
import { calcularAumUsd, calcularVariacionMensual } from "./aum";

describe("calcularAumUsd", () => {
  it("suma posiciones en USD directo", () => {
    const r = calcularAumUsd(
      [
        { snapshot_value: 100, snapshot_ccy: "USD", asset_class: "CEDEARs", ticker: "AAPL" },
        { snapshot_value: 50, snapshot_ccy: "USD", asset_class: "Liquidez", ticker: "USD" },
      ],
      1500,
    );
    expect(r.aumUsd).toBe(150);
  });

  it("convierte posiciones en ARS dividiendo por el MEP", () => {
    const r = calcularAumUsd([{ snapshot_value: 150000, snapshot_ccy: "ARS", asset_class: "Liquidez", ticker: "Pesos" }], 1500);
    expect(r.aumUsd).toBe(100);
  });

  it("mezcla ARS y USD correctamente", () => {
    const r = calcularAumUsd(
      [
        { snapshot_value: 1500000, snapshot_ccy: "ARS", asset_class: "Liquidez", ticker: "Pesos" }, // -> 1000 USD
        { snapshot_value: 500, snapshot_ccy: "USD", asset_class: "CEDEARs", ticker: "SPY" },
      ],
      1500,
    );
    expect(r.aumUsd).toBe(1500);
  });

  it("ignora posiciones en cero (no ensucian la composición)", () => {
    const r = calcularAumUsd([{ snapshot_value: 0, snapshot_ccy: "ARS", asset_class: "Liquidez", ticker: "Pesos" }], 1500);
    expect(r.aumUsd).toBe(0);
    expect(r.composicion).toHaveLength(0);
  });

  it("posiciones sin snapshot_value se tratan como cero", () => {
    const r = calcularAumUsd([{ snapshot_value: null, snapshot_ccy: "USD", asset_class: null, ticker: "X" }], 1500);
    expect(r.aumUsd).toBe(0);
  });

  it("usa 'Sin clasificar' cuando no hay asset_class", () => {
    const r = calcularAumUsd([{ snapshot_value: 10, snapshot_ccy: "USD", asset_class: null, ticker: "X" }], 1500);
    expect(r.composicion[0].clase).toBe("Sin clasificar");
  });

  it("explota con MEP inválido", () => {
    expect(() => calcularAumUsd([], 0)).toThrow();
    expect(() => calcularAumUsd([], -10)).toThrow();
  });

  it("redondea a centavos", () => {
    const r = calcularAumUsd([{ snapshot_value: 100, snapshot_ccy: "ARS", asset_class: null, ticker: "X" }], 3);
    expect(r.aumUsd).toBe(33.33);
  });
});

describe("calcularVariacionMensual", () => {
  it("devuelve null con menos de dos snapshots", () => {
    expect(calcularVariacionMensual([])).toBeNull();
    expect(calcularVariacionMensual([{ fecha: "2026-08-01", aum_usd: 100 }])).toBeNull();
  });

  it("calcula la variación contra el snapshot de ~30 días antes", () => {
    const snapshots = [
      { fecha: "2026-08-06", aum_usd: 110_000 },
      { fecha: "2026-07-07", aum_usd: 100_000 },
      { fecha: "2026-06-07", aum_usd: 50_000 },
    ];
    const r = calcularVariacionMensual(snapshots);
    expect(r).toBeCloseTo(0.1, 5);
  });

  it("no se confunde y compara siempre contra el más reciente, sin importar el orden de entrada", () => {
    const snapshots = [
      { fecha: "2026-06-07", aum_usd: 50_000 },
      { fecha: "2026-08-06", aum_usd: 110_000 },
      { fecha: "2026-07-07", aum_usd: 100_000 },
    ];
    const r = calcularVariacionMensual(snapshots);
    expect(r).toBeCloseTo(0.1, 5);
  });

  it("si no hay ningún snapshot tan viejo como 30 días, usa el más antiguo disponible", () => {
    const snapshots = [
      { fecha: "2026-08-06", aum_usd: 110_000 },
      { fecha: "2026-08-01", aum_usd: 100_000 },
    ];
    const r = calcularVariacionMensual(snapshots);
    expect(r).toBeCloseTo(0.1, 5);
  });

  it("devuelve null si la referencia tiene AUM cero (evita división por cero)", () => {
    const snapshots = [
      { fecha: "2026-08-06", aum_usd: 110_000 },
      { fecha: "2026-07-01", aum_usd: 0 },
    ];
    expect(calcularVariacionMensual(snapshots)).toBeNull();
  });

  it("devuelve null si todos los snapshots son del mismo día", () => {
    const snapshots = [
      { fecha: "2026-08-06", aum_usd: 110_000 },
      { fecha: "2026-08-06", aum_usd: 110_000 },
    ];
    expect(calcularVariacionMensual(snapshots)).toBeNull();
  });
});
