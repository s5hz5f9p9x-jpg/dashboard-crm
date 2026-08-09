"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { differenceInYears } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, CheckCircle2, X } from "lucide-react";
import { marcarAtendido, descartarDisparador, type DisparadorConCliente } from "@/app/actions/disparadores";
import { construirLinkWhatsapp, renderPlantilla, type NombrePlantilla } from "@/lib/plantillas";
import type { TipoDisparador } from "@/lib/db/schema";

const SEVERIDAD_ESTILO: Record<string, { color: string; background: string }> = {
  alta: { color: "var(--neg-soft)", background: "rgba(216,71,63,.16)" },
  media: { color: "var(--warn)", background: "rgba(224,160,42,.18)" },
  baja: { color: "var(--text-3)", background: "rgba(243,243,233,.08)" },
};

const PLANTILLA_POR_TIPO: Partial<Record<TipoDisparador, NombrePlantilla>> = {
  pedir_referido: "pedir_referido",
  aniversario: "aniversario",
  contacto_vencido: "contacto_vencido",
  inactividad_prolongada: "contacto_vencido",
};

function armarLinkWhatsapp(d: DisparadorConCliente): string | null {
  if (!d.cliente?.telefono) return null;
  const plantilla = PLANTILLA_POR_TIPO[d.tipo];
  if (!plantilla) return null;
  const años = differenceInYears(new Date(), new Date(`${d.cliente.fechaAlta}T00:00:00`));
  const mensaje = renderPlantilla(plantilla, { nombre: d.cliente.nombre, años });
  return construirLinkWhatsapp(d.cliente.telefono, mensaje);
}

export function DisparadoresList({ disparadores }: { disparadores: DisparadorConCliente[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function atender(id: string) {
    startTransition(async () => {
      await marcarAtendido(id);
      toast.success("Marcado como atendido.");
      router.refresh();
    });
  }

  function descartar(id: string) {
    startTransition(async () => {
      await descartarDisparador(id);
      toast.success("Descartado.");
      router.refresh();
    });
  }

  if (disparadores.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-3)" }}>
        No hay disparadores pendientes. Estás al día.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {disparadores.map((d) => {
        const linkWhatsapp = armarLinkWhatsapp(d);
        return (
          <Card key={d.id}>
            <CardContent className="flex items-start justify-between gap-4 py-4">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="chip" style={SEVERIDAD_ESTILO[d.severidad]}>
                    {d.severidad}
                  </span>
                  {d.cliente && (
                    <Link href={`/clientes/${d.cliente.id}`} className="text-sm font-medium hover:underline">
                      {d.cliente.apellido}, {d.cliente.nombre}
                    </Link>
                  )}
                </div>
                <p className="font-medium">{d.titulo}</p>
                {d.detalle && <p className="text-muted-foreground text-sm">{d.detalle}</p>}
                {d.accionSugerida && <p className="text-muted-foreground mt-1 text-xs italic">{d.accionSugerida}</p>}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                {linkWhatsapp && (
                  <Button size="sm" asChild>
                    <a href={linkWhatsapp} target="_blank" rel="noreferrer">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  </Button>
                )}
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => atender(d.id)}>
                    <CheckCircle2 className="h-4 w-4" /> Atendido
                  </Button>
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => descartar(d.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
