export type Semaforo = "verde" | "amarillo" | "rojo";

/**
 * Semáforo de seguimiento — SPEC.md sección 5.4.
 * Verde: por debajo del 80% de la frecuencia de contacto del segmento.
 * Amarillo: entre 80% y 100% (ambos inclusive).
 * Rojo: por encima del 100%.
 *
 * Ejemplo del SPEC (frecuencia 30 días): verde hasta el día 23, amarillo
 * del día 24 al 30, rojo desde el día 31.
 */
export function calcularSemaforo(diasDesdeUltimoContacto: number, frecuenciaDias: number): Semaforo {
  if (frecuenciaDias <= 0) {
    throw new Error("La frecuencia de contacto tiene que ser mayor a cero.");
  }
  const pct = diasDesdeUltimoContacto / frecuenciaDias;
  if (pct < 0.8) return "verde";
  if (pct <= 1) return "amarillo";
  return "rojo";
}
