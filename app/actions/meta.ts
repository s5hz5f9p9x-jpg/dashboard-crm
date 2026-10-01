"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { metaEventos, prospectos } from "@/lib/db/schema";
import type { EtapaProspecto } from "@/lib/db/schema";
import { enviarEventos, metaConfigurado, EVENTO_POR_ETAPA } from "@/lib/meta/conversiones";
import { normalizarTelefono } from "@/lib/telefono";

/**
 * Le informa a Meta que un prospecto llegó a una etapa del embudo.
 *
 * Nunca lanza: la atribución publicitaria no puede hacer fallar el guardado del
 * prospecto, que es el dato que de verdad importa. Los fallos quedan en
 * meta_eventos para poder revisarlos.
 */
export async function registrarEtapaEnMeta(prospectoId: string, etapa: EtapaProspecto): Promise<void> {
  try {
    if (!metaConfigurado()) return;

    const [p] = await db.select().from(prospectos).where(eq(prospectos.id, prospectoId));
    // Sin lead_id no hay nada que cruzar: el prospecto no vino de un anuncio.
    if (!p?.meta_lead_id) return;

    const tel = normalizarTelefono(p.telefono);
    const r = await enviarEventos([
      {
        leadId: p.meta_lead_id,
        etapa,
        email: p.email,
        telefonoE164: tel.ok ? tel.e164 : null,
      },
    ]);

    await db
      .insert(metaEventos)
      .values({
        prospecto_id: p.id,
        lead_id: p.meta_lead_id,
        event_name: EVENTO_POR_ETAPA[etapa],
        ok: r.ok,
        respuesta: r.ok ? null : `${r.estado}: ${r.respuesta}`,
      })
      // La misma etapa de un lead se informa una sola vez.
      .onConflictDoNothing({ target: [metaEventos.lead_id, metaEventos.event_name] });
  } catch (e) {
    console.error("[meta] no se pudo registrar la etapa:", e instanceof Error ? e.message : e);
  }
}
