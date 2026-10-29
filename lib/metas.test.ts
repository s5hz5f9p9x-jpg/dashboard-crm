import { describe, expect, it } from "vitest";
import {
  agendaDelDia,
  calcularMetaMensual,
  calcularRacha,
  claveSemana,
  metaSemanal,
  puntajePrioridad,
  segmentoEfectivo,
  type ClienteParaAgenda,
} from "./metas";

const FREC = { A: 30, B: 60, C: 90 } as const;

function cliente(over: Partial<ClienteParaAgenda> = {}): ClienteParaAgenda {
  return {
    id: "c1",
    nombre: "Juan",
    apellido: "Pérez",
    telefono: null,
    estado: "activo",
    segmento: "C",
    segmento_manual: null,
    aum_actual_usd: 1000,
    diasDesdeUltimoContacto: 0,
    tuvoContacto: true,
    ...over,
  };
}

describe("segmentoEfectivo", () => {
  it("el override manual le gana al calculado", () => {
    expect(segmentoEfectivo({ segmento: "C", segmento_manual: "A" })).toBe("A");
  });
  it("sin override usa el calculado", () => {
    expect(segmentoEfectivo({ segmento: "B", segmento_manual: null })).toBe("B");
  });
});

describe("calcularMetaMensual", () => {
  it("un cliente de frecuencia 30 pide ~1 contacto por mes", () => {
    expect(calcularMetaMensual([cliente({ segmento: "A" })], FREC)).toBe(1);
  });

  it("suma la cartera completa según la frecuencia de cada segmento", () => {
    const clientes = [
      ...Array.from({ length: 11 }, (_, i) => cliente({ id: `a${i}`, segmento: "A" })),
      ...Array.from({ length: 22 }, (_, i) => cliente({ id: `b${i}`, segmento: "B" })),
      ...Array.from({ length: 135 }, (_, i) => cliente({ id: `c${i}`, segmento: "C" })),
    ];
    // 11*(30.44/30) + 22*(30.44/60) + 135*(30.44/90) ≈ 11.2 + 11.2 + 45.7
    expect(calcularMetaMensual(clientes, FREC)).toBe(68);
  });

  it("ignora a los que no están activos", () => {
    const clientes = [cliente({ segmento: "A" }), cliente({ id: "x", segmento: "A", estado: "pausado" })];
    expect(calcularMetaMensual(clientes, FREC)).toBe(1);
  });

  it("respeta el override manual de segmento", () => {
    // Un C con override a A pasa de 1/3 a 1 contacto por mes.
    expect(calcularMetaMensual([cliente({ segmento: "C", segmento_manual: "A" })], FREC)).toBe(1);
  });

  it("sin clientes activos la meta es cero", () => {
    expect(calcularMetaMensual([], FREC)).toBe(0);
    expect(calcularMetaMensual([cliente({ estado: "baja" })], FREC)).toBe(0);
  });

  it("no explota si una frecuencia viene en cero", () => {
    expect(calcularMetaMensual([cliente({ segmento: "A" })], { A: 0, B: 60, C: 90 })).toBe(0);
  });
});

describe("metaSemanal", () => {
  it("reparte la meta del mes en semanas", () => {
    expect(metaSemanal(68)).toBe(16);
  });
  it("nunca baja de uno, para que la racha siga teniendo sentido", () => {
    expect(metaSemanal(0)).toBe(1);
    expect(metaSemanal(2)).toBe(1);
  });
});

describe("puntajePrioridad", () => {
  it("a igual atraso relativo, pesa más el segmento alto", () => {
    const a = cliente({ segmento: "A", diasDesdeUltimoContacto: 30 });
    const c = cliente({ segmento: "C", diasDesdeUltimoContacto: 90 });
    expect(puntajePrioridad(a, FREC)).toBeGreaterThan(puntajePrioridad(c, FREC));
  });

  it("un C muy vencido supera a un A apenas vencido", () => {
    const aRecien = cliente({ segmento: "A", diasDesdeUltimoContacto: 31 });
    const cMuyVencido = cliente({ segmento: "C", diasDesdeUltimoContacto: 400 });
    expect(puntajePrioridad(cMuyVencido, FREC)).toBeGreaterThan(puntajePrioridad(aRecien, FREC));
  });

  it("alguien recién contactado queda en cero", () => {
    expect(puntajePrioridad(cliente({ diasDesdeUltimoContacto: 0 }), FREC)).toBe(0);
  });
});

describe("agendaDelDia", () => {
  it("devuelve como mucho la cantidad pedida", () => {
    const muchos = Array.from({ length: 50 }, (_, i) =>
      cliente({ id: `c${i}`, diasDesdeUltimoContacto: 100 + i }),
    );
    expect(agendaDelDia(muchos, FREC, 5)).toHaveLength(5);
  });

  it("pone primero al más urgente", () => {
    const lista = [
      cliente({ id: "poco", segmento: "C", diasDesdeUltimoContacto: 10 }),
      cliente({ id: "mucho", segmento: "A", diasDesdeUltimoContacto: 200 }),
    ];
    expect(agendaDelDia(lista, FREC)[0].id).toBe("mucho");
  });

  it("excluye a los que ya contactaste hoy", () => {
    const lista = [cliente({ id: "hoy", diasDesdeUltimoContacto: 0, tuvoContacto: true })];
    expect(agendaDelDia(lista, FREC)).toHaveLength(0);
  });

  it("incluye a quien nunca fue contactado aunque tenga 0 días", () => {
    // Sin contactos, los días se cuentan desde el alta: 0 significa alta de hoy.
    const lista = [cliente({ id: "nuevo", diasDesdeUltimoContacto: 0, tuvoContacto: false })];
    expect(agendaDelDia(lista, FREC)).toHaveLength(1);
  });

  it("deja afuera a pausados y bajas", () => {
    const lista = [
      cliente({ id: "p", estado: "pausado", diasDesdeUltimoContacto: 500 }),
      cliente({ id: "b", estado: "baja", diasDesdeUltimoContacto: 500 }),
      cliente({ id: "a", estado: "activo", diasDesdeUltimoContacto: 10 }),
    ];
    expect(agendaDelDia(lista, FREC).map((c) => c.id)).toEqual(["a"]);
  });

  it("desempata por AUM", () => {
    const lista = [
      cliente({ id: "chico", diasDesdeUltimoContacto: 100, aum_actual_usd: 1_000 }),
      cliente({ id: "grande", diasDesdeUltimoContacto: 100, aum_actual_usd: 500_000 }),
    ];
    expect(agendaDelDia(lista, FREC)[0].id).toBe("grande");
  });
});

describe("calcularRacha", () => {
  it("cuenta las semanas cumplidas hacia atrás", () => {
    expect(calcularRacha([16, 16, 16], 16)).toBe(3);
  });
  it("se corta en la primera semana incumplida", () => {
    expect(calcularRacha([16, 2, 16, 16], 16)).toBe(2);
  });
  it("sin semanas cumplidas da cero", () => {
    expect(calcularRacha([1, 2, 3], 16)).toBe(0);
    expect(calcularRacha([], 16)).toBe(0);
  });
  it("superar el objetivo también cuenta", () => {
    expect(calcularRacha([40, 20], 16)).toBe(2);
  });
});

describe("claveSemana", () => {
  it("agrupa por el lunes de esa semana", () => {
    // 2026-10-29 es jueves; su lunes es el 26.
    expect(claveSemana(new Date("2026-10-29T15:00:00Z"))).toBe("2026-10-26");
  });
  it("un lunes se devuelve a sí mismo", () => {
    expect(claveSemana(new Date("2026-10-26T00:00:00Z"))).toBe("2026-10-26");
  });
  it("un domingo cae en la semana que arrancó el lunes anterior", () => {
    expect(claveSemana(new Date("2026-11-01T23:00:00Z"))).toBe("2026-10-26");
  });
});
