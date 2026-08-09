import { listarTareasPlan } from "@/app/actions/plan90dias";
import { TareaEstadoSelect } from "@/components/tarea-estado-select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { calcularAvance, calcularBloqueoFases, ORDEN_FASES } from "@/lib/plan90dias";
import { formatFecha, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FasePlan } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const FASE_TITULOS: Record<FasePlan, string> = {
  fase_0: "Fase 0 · Cimientos",
  fase_1: "Fase 1 · Orgánico",
  fase_2: "Fase 2 · Amplificar",
  fase_3: "Fase 3 · Sistematizar",
};

export default async function Plan90DiasPage() {
  const tareas = await listarTareasPlan();
  const avanceTotal = calcularAvance(tareas);
  const bloqueos = calcularBloqueoFases(tareas);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Plan de 90 días</h1>
        <p className="text-muted-foreground text-sm">
          {avanceTotal.hechas} de {avanceTotal.total} tareas hechas ({formatPct(avanceTotal.pct)}).
        </p>
        <div className="bg-muted mt-2 h-2 overflow-hidden rounded-full">
          <div className="bg-primary h-full rounded-full" style={{ width: `${avanceTotal.pct * 100}%` }} />
        </div>
      </div>

      {ORDEN_FASES.map((fase) => {
        const tareasFase = tareas.filter((t) => t.fase === fase);
        const avanceFase = calcularAvance(tareasFase);
        const { bloqueada, motivo } = bloqueos[fase];

        return (
          <div key={fase} className={cn("space-y-2 rounded-lg border p-4", bloqueada && "opacity-50")}>
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{FASE_TITULOS[fase]}</h2>
              <Badge variant="outline">
                {avanceFase.hechas}/{avanceFase.total}
              </Badge>
            </div>

            {bloqueada && motivo && (
              <Alert
                variant="default"
                style={{ borderColor: "rgba(224,160,42,.35)", background: "rgba(224,160,42,.10)" }}
              >
                <AlertTriangle className="h-4 w-4" style={{ color: "var(--warn)" }} />
                <AlertTitle className="text-sm">Fase con fricción</AlertTitle>
                <AlertDescription className="text-xs">
                  {motivo} Podés seguir igual — esto no bloquea nada técnicamente, es solo para que no te saltees fases sin
                  querer.
                </AlertDescription>
              </Alert>
            )}

            <div className="divide-y">
              {tareasFase.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", t.es_condicion_salida && "font-semibold")}>
                      {t.es_condicion_salida && (
                        <Badge variant="secondary" className="mr-2 text-[10px]">
                          Condición de salida
                        </Badge>
                      )}
                      {t.tarea}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Sem {t.semana}
                      {t.categoria ? ` · ${t.categoria}` : ""}
                      {t.tiempo_estimado ? ` · ${t.tiempo_estimado}` : ""}
                      {t.entregable ? ` · ${t.entregable}` : ""}
                      {t.fecha_completada ? ` · hecho el ${formatFecha(t.fecha_completada)}` : ""}
                    </p>
                  </div>
                  <TareaEstadoSelect id={t.id} estado={t.estado} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
