import type { EstadoCliente, PerfilRiesgo } from "./db/schema";

export type CampoDestino =
  | "nombre_completo"
  | "email"
  | "telefono"
  | "fecha_alta"
  | "perfil_riesgo"
  | "estado_fuente"
  | "origen"
  | "notas"
  | "identificador_cuenta";

export const CAMPOS_DESTINO: { campo: CampoDestino; etiqueta: string; requerido: boolean; alias: string[] }[] = [
  { campo: "nombre_completo", etiqueta: "Nombre completo", requerido: true, alias: ["cliente", "cuenta", "nombre", "nombre completo", "apellido y nombre", "raw_name"] },
  { campo: "fecha_alta", etiqueta: "Fecha de alta", requerido: true, alias: ["alta", "fecha de alta", "fecha alta", "fecha ingreso"] },
  { campo: "email", etiqueta: "Email", requerido: false, alias: ["email", "e-mail", "correo"] },
  { campo: "telefono", etiqueta: "Teléfono", requerido: false, alias: ["telefono", "teléfono", "tel", "celular"] },
  { campo: "perfil_riesgo", etiqueta: "Perfil de riesgo", requerido: false, alias: ["perfil", "perfil de riesgo", "perfil riesgo"] },
  { campo: "estado_fuente", etiqueta: "Estado / Activo", requerido: false, alias: ["activa", "activo", "estado"] },
  { campo: "origen", etiqueta: "Origen / Referenciador", requerido: false, alias: ["referenciador", "referidor", "origen"] },
  { campo: "identificador_cuenta", etiqueta: "N° de comitente / cuenta (se guarda en notas)", requerido: false, alias: ["comitente", "account_code"] },
  { campo: "notas", etiqueta: "Notas", requerido: false, alias: ["profesion", "asesor", "equipo", "notas", "observaciones"] },
];

export type Mapeo = Partial<Record<CampoDestino, string | null>>;

function normalizarHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function sugerirMapeo(headers: string[]): Mapeo {
  const mapeo: Mapeo = {};
  const headersNorm = headers.map((h) => ({ original: h, norm: normalizarHeader(h) }));
  for (const { campo, alias } of CAMPOS_DESTINO) {
    // primero exacto, para no confundir "cuenta" con "idcuenta"
    const match =
      headersNorm.find((h) => alias.includes(h.norm)) ??
      headersNorm.find((h) => alias.some((a) => h.norm.includes(a)));
    mapeo[campo] = match?.original ?? null;
  }
  return mapeo;
}

export interface FilaValidada {
  fila: number;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  fecha_alta: string | null;
  perfil_riesgo: PerfilRiesgo | null;
  estado: EstadoCliente;
  origen: string | null;
  notas: string;
  errores: string[];
  advertencias: string[];
}

export interface ResultadoValidacion {
  filas: FilaValidada[];
  validas: FilaValidada[];
  conErrores: FilaValidada[];
  emailsDuplicadosEnArchivo: string[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function celda(row: Record<string, unknown>, header: string | null | undefined): string | null {
  if (!header) return null;
  const v = row[header];
  if (v === undefined || v === null || v === "") return null;
  return String(v).trim();
}

function parseFecha(valor: unknown): string | null {
  if (valor === null || valor === undefined || valor === "") return null;
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return formatoISO(valor);
  }
  const s = String(valor).trim();
  // YYYY-MM-DD
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // DD/MM/YYYY
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return formatoISO(d);
  return null;
}

function formatoISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function separarNombre(nombreCompleto: string): { nombre: string; apellido: string } {
  const partes = nombreCompleto.trim().split(/\s+/);
  if (partes.length === 1) return { nombre: partes[0], apellido: partes[0] };
  const [apellido, ...resto] = partes;
  return { apellido, nombre: resto.join(" ") };
}

function normalizarPerfilRiesgo(valor: string | null): PerfilRiesgo | null {
  if (!valor) return null;
  const v = normalizarHeader(valor);
  if (v.includes("arriesg") || v.includes("agresiv")) return "agresivo";
  if (v.includes("moder")) return "moderado";
  if (v.includes("conserv")) return "conservador";
  return null;
}

function normalizarEstado(valor: string | null): EstadoCliente {
  if (!valor) return "activo";
  const v = normalizarHeader(valor);
  if (["activa", "activo", "1", "true", "si", "sí"].includes(v)) return "activo";
  return "pausado";
}

export function validarFilas(rows: Record<string, unknown>[], mapeo: Mapeo, broker?: string): ResultadoValidacion {
  const filas: FilaValidada[] = [];

  rows.forEach((row, i) => {
    const errores: string[] = [];
    const nombreCompleto = celda(row, mapeo.nombre_completo);
    const emailRaw = celda(row, mapeo.email);
    const fechaRaw = mapeo.fecha_alta ? row[mapeo.fecha_alta] : null;
    const identificador = celda(row, mapeo.identificador_cuenta);
    const notaExtra = celda(row, mapeo.notas);

    if (!nombreCompleto) errores.push("Falta el nombre");

    const email = emailRaw ? emailRaw.toLowerCase() : null;
    if (email && !EMAIL_RE.test(email)) errores.push(`Email con formato inválido: "${email}"`);

    const fecha_alta = parseFecha(fechaRaw);
    if (!fecha_alta) errores.push("Falta la fecha de alta o tiene un formato inválido");

    const { nombre, apellido } = nombreCompleto ? separarNombre(nombreCompleto) : { nombre: "", apellido: "" };

    const notasPartes: string[] = [];
    if (notaExtra) notasPartes.push(notaExtra);
    if (identificador) notasPartes.push(`Cuenta broker${broker ? ` (${broker})` : ""}: ${identificador}`);

    filas.push({
      fila: i + 1,
      nombre,
      apellido,
      email,
      telefono: celda(row, mapeo.telefono),
      fecha_alta,
      perfil_riesgo: normalizarPerfilRiesgo(celda(row, mapeo.perfil_riesgo)),
      estado: normalizarEstado(celda(row, mapeo.estado_fuente)),
      origen: celda(row, mapeo.origen),
      notas: notasPartes.join(" · "),
      errores,
      advertencias: [],
    });
  });

  // Dos clientes reales distintos (una persona y su empresa, por ejemplo) a veces
  // comparten el mismo email en el archivo de origen. clientes.email es único en
  // la base, así que no se puede guardar dos veces — pero eso no es motivo para
  // no importar al segundo cliente: se lo importa igual, sin email, con un aviso
  // (no bloqueante) en vez de descartar la fila entera.
  const emailsDuplicados = new Set<string>();
  const primeraAparicionPorEmail = new Map<string, number>();
  filas.forEach((f, i) => {
    if (!f.email) return;
    const primera = primeraAparicionPorEmail.get(f.email);
    if (primera === undefined) {
      primeraAparicionPorEmail.set(f.email, i);
    } else {
      emailsDuplicados.add(f.email);
      f.advertencias.push(
        `Email compartido con la fila ${filas[primera].fila} (${filas[primera].nombre} ${filas[primera].apellido}) — se importa sin email para no chocar con esa fila.`,
      );
      f.email = null;
    }
  });

  return {
    filas,
    validas: filas.filter((f) => f.errores.length === 0),
    conErrores: filas.filter((f) => f.errores.length > 0),
    emailsDuplicadosEnArchivo: [...emailsDuplicados],
  };
}
