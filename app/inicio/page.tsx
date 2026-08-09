import Link from "next/link";
import { listarClientes } from "@/lib/clientes";
import { obtenerDisparadoresPendientes } from "@/app/actions/disparadores";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DisparadoresList } from "@/components/disparadores-list";
import { RecalcularDisparadoresButton } from "@/components/recalcular-disparadores-button";
import { EventoMacroDialog } from "@/components/evento-macro-dialog";

export const dynamic = "force-dynamic";

export default async function InicioPage() {
  const clientes = await listarClientes();
  const disparadores = await obtenerDisparadoresPendientes();

  const activos = clientes.filter((c) => c.estado === "activo");
  const porSemaforo = {
    verde: activos.filter((c) => c.semaforo === "verde").length,
    amarillo: activos.filter((c) => c.semaforo === "amarillo").length,
    rojo: activos.filter((c) => c.semaforo === "rojo").length,
  };
  const porSegmento = {
    A: clientes.filter((c) => (c.segmento_manual ?? c.segmento) === "A").length,
    B: clientes.filter((c) => (c.segmento_manual ?? c.segmento) === "B").length,
    C: clientes.filter((c) => (c.segmento_manual ?? c.segmento) === "C").length,
  };

  if (clientes.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6 text-center">
        <h1 className="text-2xl font-black" style={{ letterSpacing: "-0.01em" }}>
          Todavía no hay clientes cargados
        </h1>
        <p style={{ color: "var(--text-3)" }}>Empezá importando la base actual desde Excel.</p>
        <Button asChild>
          <Link href="/importar">Importar clientes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-black" style={{ letterSpacing: "-0.01em" }}>
          Inicio
        </h1>
        <p className="num text-sm" style={{ color: "var(--text-4)" }}>
          {clientes.length} clientes en la base.
        </p>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black">Disparadores pendientes ({disparadores.length})</h2>
          <div className="flex gap-2">
            <EventoMacroDialog />
            <RecalcularDisparadoresButton />
          </div>
        </div>
        <DisparadoresList disparadores={disparadores} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="label">Semáforo de la cartera</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-6">
            <SemaforoStat color="var(--pos)" label="Verde" valor={porSemaforo.verde} />
            <SemaforoStat color="var(--warn)" label="Amarillo" valor={porSemaforo.amarillo} />
            <SemaforoStat color="var(--neg-soft)" label="Rojo" valor={porSemaforo.rojo} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="label">Segmentación</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-6">
            <SemaforoStat color="var(--green)" label="A" valor={porSegmento.A} />
            <SemaforoStat color="var(--warn)" label="B" valor={porSegmento.B} />
            <SemaforoStat color="var(--text-3)" label="C" valor={porSegmento.C} />
          </CardContent>
        </Card>
      </div>

      <Button asChild variant="outline">
        <Link href="/clientes">Ver todos los clientes</Link>
      </Button>
    </div>
  );
}

function SemaforoStat({ color, label, valor }: { color: string; label: string; valor: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-3 w-3 rounded-full" style={{ background: color }} />
      <span className="kpi">{valor}</span>
      <span className="text-sm" style={{ color: "var(--text-4)" }}>
        {label}
      </span>
    </div>
  );
}
