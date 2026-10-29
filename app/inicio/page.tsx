import Link from "next/link";
import { listarClientes } from "@/lib/clientes";
import { obtenerAgenda } from "@/app/actions/agenda";
import { obtenerDisparadoresPendientes } from "@/app/actions/disparadores";
import { Button } from "@/components/ui/button";
import { AgendaPanel } from "@/components/agenda-panel";
import { DisparadoresList } from "@/components/disparadores-list";
import { RecalcularDisparadoresButton } from "@/components/recalcular-disparadores-button";
import { EventoMacroDialog } from "@/components/evento-macro-dialog";

export const dynamic = "force-dynamic";

export default async function InicioPage() {
  const clientes = await listarClientes();

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

  const [agenda, disparadores] = await Promise.all([obtenerAgenda(), obtenerDisparadoresPendientes()]);

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-black" style={{ letterSpacing: "-0.01em" }}>
          Inicio
        </h1>
        <p className="num text-sm" style={{ color: "var(--text-4)" }}>
          {clientes.filter((c) => c.estado === "activo").length} clientes activos
        </p>
      </div>

      <AgendaPanel datos={agenda} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black">Disparadores ({disparadores.length})</h2>
          <div className="flex gap-2">
            <EventoMacroDialog />
            <RecalcularDisparadoresButton />
          </div>
        </div>
        <DisparadoresList disparadores={disparadores} />
      </div>
    </div>
  );
}
