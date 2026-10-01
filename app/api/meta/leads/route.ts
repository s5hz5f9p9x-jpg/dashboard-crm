/**
 * Webhook de Lead Ads de Meta.
 *
 * GET  — verificación inicial de la suscripción (hub.challenge).
 * POST — notificación de leads nuevos: se valida la firma, se piden los datos
 *        del formulario a la Graph API y se crea el prospecto.
 *
 * Es público por definición (Meta tiene que poder llamarlo), así que está
 * excluido del middleware de contraseña y la firma es lo que lo protege.
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { prospectos } from "@/lib/db/schema";
import { firmaValida, extraerLeads, mapearCamposLead, type CampoLead } from "@/lib/meta/webhook";
import { registrarEtapaEnMeta } from "@/app/actions/meta";

const VERSION_API = "v25.0";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const modo = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const esperado = process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (modo === "subscribe" && esperado && token === esperado) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("forbidden", { status: 403 });
}

async function traerDatosDelLead(leadgenId: string): Promise<CampoLead[]> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("Falta META_PAGE_ACCESS_TOKEN");

  const url = `https://graph.facebook.com/${VERSION_API}/${leadgenId}?access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Graph API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { field_data?: CampoLead[] };
  return json.field_data ?? [];
}

export async function POST(req: Request) {
  const cuerpoCrudo = await req.text();

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error("[meta/leads] falta META_APP_SECRET, se rechaza la notificación");
    return new NextResponse("not configured", { status: 503 });
  }
  if (!firmaValida(cuerpoCrudo, req.headers.get("x-hub-signature-256"), appSecret)) {
    return new NextResponse("bad signature", { status: 401 });
  }

  let cuerpo: unknown;
  try {
    cuerpo = JSON.parse(cuerpoCrudo);
  } catch {
    return new NextResponse("bad json", { status: 400 });
  }

  const leads = extraerLeads(cuerpo);
  let creados = 0;

  for (const lead of leads) {
    try {
      // Idempotencia: Meta reintenta si no respondemos 200 a tiempo.
      const [yaExiste] = await db
        .select({ id: prospectos.id })
        .from(prospectos)
        .where(eq(prospectos.meta_lead_id, lead.leadgenId));
      if (yaExiste) continue;

      const campos = await traerDatosDelLead(lead.leadgenId);
      const datos = mapearCamposLead(campos);

      const [creado] = await db
        .insert(prospectos)
        .values({
          nombre: datos.nombre ?? `Lead de Meta ${lead.leadgenId}`,
          email: datos.email,
          telefono: datos.telefono,
          origen: "publicidad_instagram",
          origen_detalle: lead.adId ? `Anuncio ${lead.adId}` : "Formulario de Meta",
          etapa: "lead",
          fecha_ingreso: (lead.creadoEn ?? new Date()).toISOString().slice(0, 10),
          meta_lead_id: lead.leadgenId,
          meta_ad_id: lead.adId,
          meta_form_id: lead.formId,
          notas: "",
        })
        .onConflictDoNothing({ target: prospectos.meta_lead_id })
        .returning({ id: prospectos.id });

      if (creado) {
        creados++;
        // Meta espera recibir también el evento del lead inicial.
        await registrarEtapaEnMeta(creado.id, "lead");
      }
    } catch (e) {
      // No se devuelve error: si respondemos distinto de 200, Meta reintenta
      // toda la notificación y reprocesaríamos los leads que sí entraron.
      console.error(`[meta/leads] lead ${lead.leadgenId}:`, e instanceof Error ? e.message : e);
    }
  }

  return NextResponse.json({ recibidos: leads.length, creados });
}
