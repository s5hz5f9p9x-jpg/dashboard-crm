import { obtenerMetricasSemanales, obtenerModeloEconomicoAction } from "@/app/actions/metricas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MetricasTable } from "@/components/metricas-table";
import { LeadsCalificadosChart, CacComparisonChart } from "@/components/metricas-charts";
import { formatPct, formatUSD } from "@/lib/format";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MetricasPage() {
  const [metricas, modelo] = await Promise.all([obtenerMetricasSemanales(), obtenerModeloEconomicoAction()]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Métricas</h1>
        <p className="text-muted-foreground text-sm">Las 13 semanas del plan de 90 días. Los campos con ícono se calculan solos.</p>
      </div>

      <MetricasTable metricas={metricas} />

      <Card>
        <CardHeader>
          <CardTitle>Evolución de leads calificados</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadsCalificadosChart metricas={metricas} />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-medium">Modelo económico</h2>

        {modelo.retencionEsSupuesto && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Retención basada en un supuesto, no en datos propios</AlertTitle>
            <AlertDescription>
              Todavía no hay 12 meses de historia suficiente para calcular la retención real, así que se está usando el
              valor de configuración ({formatPct(modelo.retencionUsada)}). En cuanto haya más historia, este número se va a
              reemplazar solo por el real.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-normal">Ingreso anual promedio</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{formatUSD(modelo.ingresoAnual)}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-normal">
                Retención {modelo.retencionEsSupuesto ? "(supuesto)" : "(real)"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{formatPct(modelo.retencionUsada)}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-normal">Vida media del cliente</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{modelo.vidaMediaAnios.toFixed(1)} años</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-normal">LTV</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{formatUSD(modelo.ltv)}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-normal">CAC máximo tolerable</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{formatUSD(modelo.cacMaximo)}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground flex items-center justify-between text-sm font-normal">
                CAC real
                {modelo.puedeEscalar !== null && (
                  <span
                    className="chip"
                    style={
                      modelo.puedeEscalar
                        ? { color: "var(--green)", background: "var(--green-tint)" }
                        : { color: "var(--neg-soft)", background: "rgba(216,71,63,.16)" }
                    }
                  >
                    {modelo.puedeEscalar ? "Se puede escalar" : "No escalar"}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{modelo.cacReal === null ? "—" : formatUSD(modelo.cacReal)}</CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>CAC real vs. CAC máximo tolerable</CardTitle>
          </CardHeader>
          <CardContent>
            <CacComparisonChart cacReal={modelo.cacReal} cacMaximo={modelo.cacMaximo} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
