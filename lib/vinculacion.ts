export interface ClienteLocal {
  id: string;
  nombre: string;
  apellido: string;
  notas: string | null;
}

export interface CuentaSupabase {
  id: string;
  broker: string;
  account_code: string;
  raw_name: string;
}

export type Confianza = "fuerte" | "media" | "sin_sugerencia";

export interface Sugerencia {
  clienteId: string | null;
  confianza: Confianza;
  razon: string;
}

function normalizarNombre(s: string): string {
  return s
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

function extraerHintsCuentaBroker(notas: string | null): { broker: string; codigo: string }[] {
  if (!notas) return [];
  const hints: { broker: string; codigo: string }[] = [];
  const re = /Cuenta broker \(([^)]+)\):\s*(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(notas)) !== null) {
    hints.push({ broker: m[1].toUpperCase(), codigo: m[2] });
  }
  return hints;
}

/**
 * Sugiere con qué cliente local vincular una cuenta de Supabase. Nunca vincula
 * solo/a — devuelve una sugerencia para que el usuario confirme a mano
 * (SPEC.md sección 7: "nunca vincules automáticamente por similitud de nombre").
 *
 * Confianza "fuerte": coincide el n° de cuenta/comitente que el importador ya
 * había guardado en las notas del cliente al leer el mismo Excel (no es una
 * coincidencia difusa, es el mismo identificador de origen — ver ETAPA_0_MAPEO.md).
 * Confianza "media": coincide el nombre normalizado, nada más — requiere ojo.
 */
export function sugerirVinculo(cuenta: CuentaSupabase, clientes: ClienteLocal[]): Sugerencia {
  for (const c of clientes) {
    const hints = extraerHintsCuentaBroker(c.notas);
    const match = hints.find((h) => h.broker === cuenta.broker.toUpperCase() && h.codigo === cuenta.account_code);
    if (match) {
      return {
        clienteId: c.id,
        confianza: "fuerte",
        razon: `Coincide el n° de cuenta guardado al importar (${cuenta.broker} ${cuenta.account_code})`,
      };
    }
  }

  const nombreCuenta = normalizarNombre(cuenta.raw_name);
  if (nombreCuenta) {
    for (const c of clientes) {
      const nombreCliente = normalizarNombre(`${c.apellido} ${c.nombre}`);
      if (nombreCliente === nombreCuenta) {
        return {
          clienteId: c.id,
          confianza: "media",
          razon: `Mismo nombre normalizado: "${cuenta.raw_name}"`,
        };
      }
    }
  }

  return { clienteId: null, confianza: "sin_sugerencia", razon: "No se encontró coincidencia" };
}

export function sugerirVinculos(
  cuentas: CuentaSupabase[],
  clientes: ClienteLocal[],
): Map<string, Sugerencia> {
  const resultado = new Map<string, Sugerencia>();
  for (const cuenta of cuentas) {
    resultado.set(cuenta.id, sugerirVinculo(cuenta, clientes));
  }
  return resultado;
}
