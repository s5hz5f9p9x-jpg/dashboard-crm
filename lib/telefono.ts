/**
 * Normalización de teléfonos argentinos a formato E.164 para WhatsApp.
 *
 * WhatsApp necesita 549 + código de área + número (sin el 0 ni el 15).
 * La regla de oro acá es NO adivinar: si falta el código de área o el
 * formato es ambiguo, se devuelve un error para que lo corrija una persona.
 * Un número mal deducido significa mandarle a un desconocido un mensaje con
 * el monto que cobra un cliente.
 */

export type TelefonoNormalizado =
  | { ok: true; e164: string; original: string }
  | { ok: false; motivo: string; original: string };

/** Largo del número nacional significativo argentino: área + abonado. */
const LARGO_NSN = 10;

/**
 * Un código de área argentino empieza con 11 (AMBA) o con 2/3 (interior).
 * Sirve para descartar casos donde el "15" quedó al principio y el área se perdió.
 */
function areaPlausible(nsn: string): boolean {
  if (nsn.startsWith("11")) return true;
  return nsn[0] === "2" || nsn[0] === "3";
}

/**
 * Saca el prefijo 15 de móvil cuando el número quedó con 12 dígitos
 * (área + 15 + abonado). Prueba las tres longitudes de área posibles.
 */
function quitarPrefijo15(nsn: string): string | null {
  if (nsn.length !== LARGO_NSN + 2) return null;
  for (const largoArea of [2, 3, 4]) {
    if (nsn.slice(largoArea, largoArea + 2) !== "15") continue;
    const candidato = nsn.slice(0, largoArea) + nsn.slice(largoArea + 2);
    if (candidato.length === LARGO_NSN && areaPlausible(candidato)) return candidato;
  }
  return null;
}

export function normalizarTelefono(raw: string | null | undefined): TelefonoNormalizado {
  const original = (raw ?? "").trim();
  if (!original) return { ok: false, motivo: "Sin teléfono cargado", original };

  let n = original.replace(/\D/g, "");
  if (!n) return { ok: false, motivo: "No contiene dígitos", original };

  // Prefijo internacional, con o sin el 9 de móvil.
  if (n.startsWith("549")) n = n.slice(3);
  else if (n.startsWith("54")) n = n.slice(2);

  // Prefijo de larga distancia nacional.
  while (n.startsWith("0")) n = n.slice(1);

  if (n.length === LARGO_NSN + 2) {
    const sin15 = quitarPrefijo15(n);
    if (!sin15) {
      return { ok: false, motivo: `12 dígitos pero no se reconoce el prefijo 15: "${n}"`, original };
    }
    n = sin15;
  }

  if (n.length < LARGO_NSN) {
    return { ok: false, motivo: `Faltan dígitos (${n.length} de ${LARGO_NSN}), probablemente sin código de área`, original };
  }
  if (n.length > LARGO_NSN) {
    return { ok: false, motivo: `Tiene ${n.length} dígitos, más de los ${LARGO_NSN} esperados`, original };
  }
  if (!areaPlausible(n)) {
    // Caso típico: "1535606334" = 15 + abonado, sin el área. No se puede deducir.
    return { ok: false, motivo: `No empieza con un código de área válido: "${n}"`, original };
  }

  return { ok: true, e164: `549${n}`, original };
}

/** Link de WhatsApp listo para abrir con el mensaje precargado. */
export function linkWhatsApp(e164: string, mensaje: string): string {
  return `https://wa.me/${e164}?text=${encodeURIComponent(mensaje)}`;
}
