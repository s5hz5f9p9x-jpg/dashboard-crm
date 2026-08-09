import { describe, expect, it } from "vitest";
import { calcularSemaforo } from "./semaforo";

describe("calcularSemaforo", () => {
  it("verde bien por debajo de la frecuencia", () => {
    expect(calcularSemaforo(5, 30)).toBe("verde");
  });

  it("verde justo debajo del 80%", () => {
    expect(calcularSemaforo(23, 30)).toBe("verde");
  });

  it("amarillo exactamente en el 80%", () => {
    expect(calcularSemaforo(24, 30)).toBe("amarillo");
  });

  it("amarillo entre 80% y 100%", () => {
    expect(calcularSemaforo(27, 30)).toBe("amarillo");
  });

  it("amarillo exactamente en el 100%", () => {
    expect(calcularSemaforo(30, 30)).toBe("amarillo");
  });

  it("rojo apenas pasado el 100%", () => {
    expect(calcularSemaforo(31, 30)).toBe("rojo");
  });

  it("rojo bien por encima de la frecuencia", () => {
    expect(calcularSemaforo(90, 30)).toBe("rojo");
  });

  it("funciona igual con otras frecuencias (segmento B, 60 días)", () => {
    expect(calcularSemaforo(47, 60)).toBe("verde");
    expect(calcularSemaforo(48, 60)).toBe("amarillo");
    expect(calcularSemaforo(61, 60)).toBe("rojo");
  });

  it("explota con frecuencia cero o negativa", () => {
    expect(() => calcularSemaforo(10, 0)).toThrow();
    expect(() => calcularSemaforo(10, -5)).toThrow();
  });

  it("día cero (contacto recién registrado) siempre es verde", () => {
    expect(calcularSemaforo(0, 30)).toBe("verde");
  });
});
