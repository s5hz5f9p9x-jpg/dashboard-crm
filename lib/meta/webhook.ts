/**
 * Verificación de los webhooks de Meta.
 *
 * El endpoint es público (Meta tiene que poder llamarlo), así que la firma es
 * lo único que impide que cualquiera nos cargue prospectos inventados.
 */

import crypto from "node:crypto";

/**
 * Valida la cabecera X-Hub-Signature-256 contra el cuerpo crudo del pedido.
 * Usa comparación de tiempo constante para no filtrar la firma correcta.
 */
export function firmaValida(cuerpoCrudo: string, cabecera: string | null, appSecret: string): boolean {
  if (!cabecera || !appSecret) return false;
  const [algo, firmaRecibida] = cabecera.split("=");
  if (algo !== "sha256" || !firmaRecibida) return false;

  const esperada = crypto.createHmac("sha256", appSecret).update(cuerpoCrudo).digest("hex");
  const a = Buffer.from(esperada, "hex");
  const b = Buffer.from(firmaRecibida, "hex");
  if (a.length !== b.length || a.length === 0) return false;
  return crypto.timingSafeEqual(a, b);
}

export interface LeadNotificado {
  leadgenId: string;
  formId: string | null;
  adId: string | null;
  creadoEn: Date | null;
}

interface CambioLeadgen {
  field?: string;
  value?: { leadgen_id?: string; form_id?: string; ad_id?: string; created_time?: number };
}

/**
 * Extrae los leads de una notificación. Un mismo webhook puede traer varios,
 * y puede traer cambios de otros tipos que hay que ignorar.
 */
export function extraerLeads(cuerpo: unknown): LeadNotificado[] {
  const leads: LeadNotificado[] = [];
  const entradas = (cuerpo as { entry?: { changes?: CambioLeadgen[] }[] })?.entry;
  if (!Array.isArray(entradas)) return leads;

  for (const entrada of entradas) {
    for (const cambio of entrada?.changes ?? []) {
      if (cambio?.field !== "leadgen") continue;
      const id = cambio.value?.leadgen_id;
      if (!id) continue;
      leads.push({
        leadgenId: String(id),
        formId: cambio.value?.form_id ? String(cambio.value.form_id) : null,
        adId: cambio.value?.ad_id ? String(cambio.value.ad_id) : null,
        creadoEn: cambio.value?.created_time ? new Date(cambio.value.created_time * 1000) : null,
      });
    }
  }
  return leads;
}

export interface CampoLead {
  name: string;
  values: string[];
}

export interface DatosLead {
  nombre: string | null;
  email: string | null;
  telefono: string | null;
}

/**
 * Mapea los campos del formulario a lo que guarda el CRM. Meta nombra los
 * campos estándar en inglés (full_name, email, phone_number) pero un formulario
 * puede traer nombres propios, así que se buscan por coincidencia parcial.
 */
export function mapearCamposLead(campos: CampoLead[]): DatosLead {
  const buscar = (...claves: string[]): string | null => {
    for (const clave of claves) {
      const campo = campos.find((c) => c.name?.toLowerCase().includes(clave));
      const valor = campo?.values?.[0]?.trim();
      if (valor) return valor;
    }
    return null;
  };

  // El orden importa: "first_name" contiene "name", así que la búsqueda suelta
  // por "name" se deja para el final, después de intentar el nombre completo
  // explícito y de componerlo a partir de nombre + apellido.
  const completo = buscar("full_name", "nombre_completo");
  const primerNombre = buscar("first_name", "primer_nombre");
  const apellido = buscar("last_name", "apellido");
  const compuesto = [primerNombre, apellido].filter(Boolean).join(" ") || null;

  return {
    nombre: completo ?? compuesto ?? buscar("name", "nombre"),
    email: buscar("email", "correo"),
    telefono: buscar("phone_number", "phone", "telefono", "celular"),
  };
}
