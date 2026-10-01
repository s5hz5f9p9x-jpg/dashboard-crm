/**
 * Conversions API de Meta para integración de CRM.
 *
 * Es una integración distinta del pixel: le avisa a Meta cómo avanza cada lead
 * dentro del embudo, para que optimice por quién termina siendo cliente y no
 * sólo por quién completa el formulario.
 *
 * Especificación: graph.facebook.com/{version}/{pixel_id}/events
 *   action_source: "system_generated"
 *   custom_data.event_source: "crm"
 *   user_data.lead_id: el leadgen_id de 15-17 dígitos que manda el webhook
 */

import crypto from "node:crypto";
import type { EtapaProspecto } from "@/lib/db/schema";

const VERSION_API = "v25.0";

/**
 * Nombre del evento por etapa. Meta los trata como etiquetas libres del embudo
 * del anunciante; lo que importa es que sean estables en el tiempo, porque la
 * optimización aprende sobre estos nombres.
 */
export const EVENTO_POR_ETAPA: Record<EtapaProspecto, string> = {
  lead: "initial_lead",
  calificado: "qualified_lead",
  diagnostico_enviado: "diagnostic_sent",
  llamada_agendada: "call_scheduled",
  llamada_realizada: "call_completed",
  propuesta: "proposal_sent",
  ganado: "converted",
  perdido: "disqualified",
};

/** SHA-256 en hexadecimal, que es lo que pide Meta para los datos de contacto. */
function hash(valor: string): string {
  return crypto.createHash("sha256").update(valor).digest("hex");
}

/** Email normalizado según Meta: sin espacios alrededor y todo en minúscula. */
export function hashEmail(email: string | null | undefined): string | null {
  const limpio = (email ?? "").trim().toLowerCase();
  return limpio ? hash(limpio) : null;
}

/**
 * Teléfono normalizado según Meta: sólo dígitos, con código de país y sin
 * ceros a la izquierda. Se espera el E.164 que produce lib/telefono.ts.
 */
export function hashTelefono(e164: string | null | undefined): string | null {
  const soloDigitos = (e164 ?? "").replace(/\D/g, "").replace(/^0+/, "");
  return soloDigitos ? hash(soloDigitos) : null;
}

export interface EventoCrm {
  /** leadgen_id de Meta, la clave de cruce de mayor prioridad. */
  leadId: string;
  etapa: EtapaProspecto;
  /** Momento del cambio de etapa. Por defecto, ahora. */
  ocurridoEn?: Date;
  email?: string | null;
  /** Teléfono ya en E.164 (ver normalizarTelefono). */
  telefonoE164?: string | null;
}

export interface ResultadoEnvio {
  ok: boolean;
  estado: number;
  respuesta: string;
}

/** Arma el cuerpo del pedido. Separado del envío para poder testearlo. */
export function construirPayload(eventos: EventoCrm[], nombreCrm = "Driver Capital CRM") {
  return {
    data: eventos.map((e) => {
      const user_data: Record<string, unknown> = { lead_id: e.leadId };
      const em = hashEmail(e.email);
      const ph = hashTelefono(e.telefonoE164);
      if (em) user_data.em = [em];
      if (ph) user_data.ph = [ph];

      return {
        event_name: EVENTO_POR_ETAPA[e.etapa],
        event_time: Math.floor((e.ocurridoEn ?? new Date()).getTime() / 1000),
        action_source: "system_generated",
        user_data,
        custom_data: { lead_event_source: nombreCrm, event_source: "crm" },
      };
    }),
  };
}

export function metaConfigurado(): boolean {
  return !!(process.env.META_PIXEL_ID && process.env.META_ACCESS_TOKEN);
}

/**
 * Envía los eventos a Meta. No lanza: devuelve el resultado para que quien
 * llame lo registre. Un fallo de atribución no debe romper el guardado del
 * prospecto, que es el dato que de verdad importa.
 */
export async function enviarEventos(eventos: EventoCrm[]): Promise<ResultadoEnvio> {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_ACCESS_TOKEN;
  if (!pixelId || !token) {
    return { ok: false, estado: 0, respuesta: "Faltan META_PIXEL_ID o META_ACCESS_TOKEN" };
  }
  if (eventos.length === 0) return { ok: true, estado: 0, respuesta: "sin eventos" };

  const url = `https://graph.facebook.com/${VERSION_API}/${pixelId}/events?access_token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(construirPayload(eventos)),
    });
    const texto = await res.text();
    return { ok: res.ok, estado: res.status, respuesta: texto.slice(0, 1000) };
  } catch (e) {
    return { ok: false, estado: 0, respuesta: e instanceof Error ? e.message : String(e) };
  }
}
