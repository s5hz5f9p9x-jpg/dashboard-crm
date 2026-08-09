import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerFichaCliente } from "@/lib/clientes";
import { calcularVariacionMensual } from "@/lib/aum";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SegmentoBadge } from "@/components/segmento-badge";
import { AumChart } from "@/components/aum-chart";
import { SegmentoOverrideDialog } from "@/components/segmento-override-dialog";
import { RegistrarContactoDialog } from "@/components/registrar-contacto-dialog";
import { DisparadoresList } from "@/components/disparadores-list";
import type { DisparadorConCliente } from "@/app/actions/disparadores";
import { formatFecha, formatUSD } from "@/lib/format";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const TIPO_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  llamada: "Llamada",
  reunion: "Reunión",
  reporte_enviado: "Reporte enviado",
};

export default async function FichaClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ficha = await obtenerFichaCliente(id);
  if (!ficha) notFound();

  const { cliente, contactos, snapshots, referidos } = ficha;
  const segmentoEfectivo = cliente.segmento_manual ?? cliente.segmento;

  const variacionMes = calcularVariacionMensual(snapshots.map((s) => ({ fecha: s.fecha, aum_usd: s.aum_usd })));
  const ultimoSnapshot = [...snapshots].sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0];
  const composicion = ultimoSnapshot?.composicion ?? null;

  const disparadoresCliente: DisparadorConCliente[] = ficha.disparadores.map((d) => ({
    id: d.id,
    tipo: d.tipo,
    severidad: d.severidad,
    titulo: d.titulo,
    detalle: d.detalle,
    accionSugerida: d.accion_sugerida,
    fechaGenerado: d.fecha_generado.toISOString(),
    cliente: { id: cliente.id, nombre: cliente.nombre, apellido: cliente.apellido, telefono: cliente.telefono, fechaAlta: cliente.fecha_alta },
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <Link href="/clientes" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="h-4 w-4" /> Volver a clientes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {cliente.apellido}, {cliente.nombre}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <SegmentoBadge segmento={segmentoEfectivo} manual={!!cliente.segmento_manual} />
            <Badge variant="outline" className="capitalize">
              {cliente.nivel_servicio}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {cliente.estado}
            </Badge>
          </div>
          {cliente.segmento_manual && cliente.segmento_manual_motivo && (
            <p className="text-muted-foreground mt-1 text-xs">Motivo del override: {cliente.segmento_manual_motivo}</p>
          )}
        </div>
        <div className="flex gap-2">
          <SegmentoOverrideDialog
            clienteId={cliente.id}
            segmentoManualActual={cliente.segmento_manual}
            motivoActual={cliente.segmento_manual_motivo}
          />
          <RegistrarContactoDialog clienteId={cliente.id} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">AUM actual</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatUSD(cliente.aum_actual_usd)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">Variación del mes</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {variacionMes === null ? "—" : `${variacionMes >= 0 ? "+" : ""}${(variacionMes * 100).toFixed(1)}%`}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">Cliente desde</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatFecha(cliente.fecha_alta)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolución de AUM</CardTitle>
        </CardHeader>
        <CardContent>
          <AumChart snapshots={snapshots.map((s) => ({ fecha: s.fecha, aum_usd: s.aum_usd }))} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contactos</CardTitle>
          </CardHeader>
          <CardContent>
            {contactos.length === 0 ? (
              <p className="text-muted-foreground text-sm">Todavía no hay contactos registrados.</p>
            ) : (
              <ul className="space-y-3">
                {contactos.map((c) => (
                  <li key={c.id} className="border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {TIPO_LABEL[c.tipo] ?? c.tipo} · <span className="text-muted-foreground capitalize">{c.direccion}</span>
                      </span>
                      <span className="text-muted-foreground text-xs">{formatFecha(c.fecha)}</span>
                    </div>
                    {c.resumen && <p className="text-muted-foreground mt-1 text-sm">{c.resumen}</p>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referidos que trajo</CardTitle>
          </CardHeader>
          <CardContent>
            {referidos.length === 0 ? (
              <p className="text-muted-foreground text-sm">Todavía no trajo referidos.</p>
            ) : (
              <ul className="space-y-2">
                {referidos.map((r) => (
                  <li key={r.id}>
                    <Link href={`/clientes/${r.id}`} className="text-sm hover:underline">
                      {r.apellido}, {r.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {composicion && composicion.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Composición de cartera</CardTitle>
            <p className="text-muted-foreground text-xs">Al {formatFecha(ultimoSnapshot!.fecha)}</p>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {[...composicion]
                .sort((a, b) => b.monto_usd - a.monto_usd)
                .map((item, i) => (
                  <li key={i} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <span className="font-medium">{item.instrumento}</span>
                      <span className="text-muted-foreground ml-2">{item.clase}</span>
                    </div>
                    <span>{formatUSD(item.monto_usd)}</span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-lg font-medium">Disparadores activos</h2>
        <DisparadoresList disparadores={disparadoresCliente} />
      </div>

      {cliente.notas && (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">{cliente.notas}</CardContent>
        </Card>
      )}
    </div>
  );
}
