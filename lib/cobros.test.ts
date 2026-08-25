import { describe, expect, it } from "vitest";
import { calcularCobros, semanaDe, totalDeCobros, type FlujoBono, type PosicionCliente } from "./cobros";

const FLUJOS: FlujoBono[] = [
  { ticker: "AL30", fecha: "2026-07-09", interest: 0.27, amort: 8 },
  { ticker: "AL30", fecha: "2027-01-09", interest: 0.24, amort: 8 },
  { ticker: "GD35", fecha: "2026-07-09", interest: 2.0625, amort: 0 },
  { ticker: "AE38", fecha: "2026-07-09", interest: 2.5, amort: 0 },
];

describe("calcularCobros", () => {
  it("calcula renta y amortización sobre los nominales del cliente", () => {
    const pos: PosicionCliente[] = [{ clienteId: "c1", ticker: "AL30", nominales: 10_000 }];
    const { porCliente } = calcularCobros(pos, FLUJOS, "2026-07-01", "2026-07-31");

    const d = porCliente.get("c1")!;
    expect(d).toHaveLength(1);
    // 0.27 por cada 100 => 0.0027 * 10000 = 27 ; amort 8 por cada 100 => 800
    expect(d[0].rentaUsd).toBeCloseTo(27, 6);
    expect(d[0].amortUsd).toBeCloseTo(800, 6);
    expect(d[0].totalUsd).toBeCloseTo(827, 6);
  });

  it("solo toma los flujos dentro de la ventana", () => {
    const pos: PosicionCliente[] = [{ clienteId: "c1", ticker: "AL30", nominales: 100 }];
    const { porCliente } = calcularCobros(pos, FLUJOS, "2026-07-01", "2026-07-31");
    expect(porCliente.get("c1")).toHaveLength(1);
    expect(porCliente.get("c1")![0].fecha).toBe("2026-07-09");
  });

  it("incluye los bordes de la ventana", () => {
    const pos: PosicionCliente[] = [{ clienteId: "c1", ticker: "AL30", nominales: 100 }];
    expect(calcularCobros(pos, FLUJOS, "2026-07-09", "2026-07-09").porCliente.get("c1")).toHaveLength(1);
  });

  it("suma los nominales cuando el cliente tiene el mismo bono en dos cuentas", () => {
    const pos: PosicionCliente[] = [
      { clienteId: "c1", ticker: "AL30", nominales: 6_000 },
      { clienteId: "c1", ticker: "AL30", nominales: 4_000 },
    ];
    const d = calcularCobros(pos, FLUJOS, "2026-07-01", "2026-07-31").porCliente.get("c1")!;
    expect(d).toHaveLength(1);
    expect(d[0].nominales).toBe(10_000);
    expect(d[0].totalUsd).toBeCloseTo(827, 6);
  });

  it("separa los cobros por cliente", () => {
    const pos: PosicionCliente[] = [
      { clienteId: "c1", ticker: "AL30", nominales: 10_000 },
      { clienteId: "c2", ticker: "GD35", nominales: 1_000 },
    ];
    const { porCliente } = calcularCobros(pos, FLUJOS, "2026-07-01", "2026-07-31");
    expect(porCliente.get("c1")![0].ticker).toBe("AL30");
    expect(porCliente.get("c2")![0].ticker).toBe("GD35");
    expect(porCliente.get("c2")![0].totalUsd).toBeCloseTo(20.625, 6);
  });

  it("ordena por fecha y, dentro del día, de mayor a menor monto", () => {
    const pos: PosicionCliente[] = [
      { clienteId: "c1", ticker: "GD35", nominales: 1_000 }, // 20.625 el 09/07
      { clienteId: "c1", ticker: "AE38", nominales: 10_000 }, // 250 el 09/07
      { clienteId: "c1", ticker: "AL30", nominales: 100 }, // 8.27 el 09/07
    ];
    const d = calcularCobros(pos, FLUJOS, "2026-07-01", "2026-07-31").porCliente.get("c1")!;
    expect(d.map((x) => x.ticker)).toEqual(["AE38", "GD35", "AL30"]);
  });

  it("ignora posiciones en cero o negativas", () => {
    const pos: PosicionCliente[] = [
      { clienteId: "c1", ticker: "AL30", nominales: 0 },
      { clienteId: "c2", ticker: "AL30", nominales: -500 },
    ];
    const { porCliente } = calcularCobros(pos, FLUJOS, "2026-07-01", "2026-07-31");
    expect(porCliente.size).toBe(0);
  });

  it("no inventa cobros para un bono sin cronograma: lo reporta aparte", () => {
    const pos: PosicionCliente[] = [
      { clienteId: "c1", ticker: "RARO1", nominales: 10_000, assetClass: "Bonos soberanos" },
    ];
    const r = calcularCobros(pos, FLUJOS, "2026-07-01", "2026-07-31");
    expect(r.porCliente.size).toBe(0);
    expect(r.tickersSinCronograma).toEqual(["RARO1"]);
  });

  it("no reporta como faltante un ticker que sí tiene cronograma", () => {
    const pos: PosicionCliente[] = [
      { clienteId: "c1", ticker: "AL30", nominales: 100, assetClass: "Bonos soberanos" },
    ];
    expect(calcularCobros(pos, FLUJOS, "2026-07-01", "2026-07-31").tickersSinCronograma).toEqual([]);
  });

  it("no reclama cronograma a lo que no lleva cupón (acciones, CEDEARs, efectivo)", () => {
    const pos: PosicionCliente[] = [
      { clienteId: "c1", ticker: "AAPL", nominales: 50, assetClass: "Acciones" },
      { clienteId: "c1", ticker: "SPY", nominales: 10, assetClass: "CEDEARs" },
      { clienteId: "c1", ticker: "DOLAR EXT.", nominales: 1_000, assetClass: "Liquidez" },
      { clienteId: "c1", ticker: "SINCLASE", nominales: 10, assetClass: null },
    ];
    expect(calcularCobros(pos, FLUJOS, "2026-07-01", "2026-07-31").tickersSinCronograma).toEqual([]);
  });

  it("reclama cronograma para las tres clases de renta fija", () => {
    const pos: PosicionCliente[] = [
      { clienteId: "c1", ticker: "BONO1", nominales: 10, assetClass: "Bonos soberanos" },
      { clienteId: "c1", ticker: "ON1", nominales: 10, assetClass: "Obligaciones Negociables" },
      { clienteId: "c1", ticker: "LETRA1", nominales: 10, assetClass: "Letras" },
    ];
    expect(calcularCobros(pos, FLUJOS, "2026-07-01", "2026-07-31").tickersSinCronograma).toEqual([
      "BONO1",
      "LETRA1",
      "ON1",
    ]);
  });

  it("descarta flujos de monto cero (fechas de emisión del cronograma)", () => {
    const flujos: FlujoBono[] = [{ ticker: "XX", fecha: "2026-07-09", interest: 0, amort: 0 }];
    const pos: PosicionCliente[] = [{ clienteId: "c1", ticker: "XX", nominales: 10_000 }];
    expect(calcularCobros(pos, flujos, "2026-07-01", "2026-07-31").porCliente.size).toBe(0);
  });
});

describe("totalDeCobros", () => {
  it("suma los montos", () => {
    const pos: PosicionCliente[] = [
      { clienteId: "c1", ticker: "AL30", nominales: 10_000 },
      { clienteId: "c1", ticker: "AE38", nominales: 10_000 },
    ];
    const d = calcularCobros(pos, FLUJOS, "2026-07-01", "2026-07-31").porCliente.get("c1")!;
    expect(totalDeCobros(d)).toBeCloseTo(827 + 250, 6);
  });

  it("de una lista vacía da cero", () => {
    expect(totalDeCobros([])).toBe(0);
  });
});

describe("semanaDe", () => {
  it("un martes devuelve lunes a domingo", () => {
    // 2026-08-25 es martes
    expect(semanaDe("2026-08-25")).toEqual({ desde: "2026-08-24", hasta: "2026-08-30" });
  });

  it("un lunes se devuelve a sí mismo como inicio", () => {
    expect(semanaDe("2026-08-24")).toEqual({ desde: "2026-08-24", hasta: "2026-08-30" });
  });

  it("un domingo cierra su propia semana", () => {
    expect(semanaDe("2026-08-30")).toEqual({ desde: "2026-08-24", hasta: "2026-08-30" });
  });

  it("funciona cruzando fin de mes", () => {
    expect(semanaDe("2026-09-01")).toEqual({ desde: "2026-08-31", hasta: "2026-09-06" });
  });
});
