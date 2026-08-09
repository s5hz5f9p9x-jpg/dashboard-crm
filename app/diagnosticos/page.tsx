import Link from "next/link";
import { listarDiagnosticos } from "@/app/actions/diagnosticos";
import { db } from "@/lib/db/client";
import { prospectos } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NuevoDiagnosticoDialog } from "@/components/nuevo-diagnostico-dialog";
import { DiagnosticosChart } from "@/components/diagnosticos-chart";
import { formatFecha } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DiagnosticosPage() {
  const [diagnosticosList, todosProspectos] = await Promise.all([
    listarDiagnosticos(),
    db.select({ id: prospectos.id, nombre: prospectos.nombre }).from(prospectos),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Diagnósticos</h1>
          <p className="text-muted-foreground text-sm">La oferta de entrada del sistema.</p>
        </div>
        <NuevoDiagnosticoDialog prospectos={todosProspectos} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Minutos de producción por diagnóstico</CardTitle>
          <p className="text-muted-foreground text-xs">La curva de aprendizaje debería bajar de ~60 a ~20 minutos.</p>
        </CardHeader>
        <CardContent>
          <DiagnosticosChart diagnosticos={diagnosticosList} />
        </CardContent>
      </Card>

      <div className="space-y-2">
        {diagnosticosList.map((d) => (
          <Link
            key={d.id}
            href={`/diagnosticos/${d.id}`}
            className="hover:bg-muted/50 flex items-center justify-between rounded-md border p-3 text-sm"
          >
            <div>
              <p className="font-medium">{d.prospectoNombre}</p>
              <p className="text-muted-foreground text-xs">Solicitado {formatFecha(d.fechaSolicitud)}</p>
            </div>
            <div className="flex items-center gap-2">
              {d.minutosProduccion !== null && <span className="text-muted-foreground text-xs">{d.minutosProduccion} min</span>}
              <Badge variant={d.enviado ? "secondary" : "outline"}>{d.enviado ? "Enviado" : "En preparación"}</Badge>
            </div>
          </Link>
        ))}
        {diagnosticosList.length === 0 && <p className="text-muted-foreground text-sm">Todavía no creaste ningún diagnóstico.</p>}
      </div>
    </div>
  );
}
