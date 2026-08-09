import { listarProspectos } from "@/app/actions/prospectos";
import { PipelineBoard } from "@/components/pipeline-board";
import { NuevoProspectoDialog } from "@/components/nuevo-prospecto-dialog";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const prospectos = await listarProspectos();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pipeline</h1>
          <p className="text-muted-foreground text-sm">{prospectos.length} prospectos. Arrastrá las tarjetas entre columnas.</p>
        </div>
        <NuevoProspectoDialog />
      </div>
      <PipelineBoard
        prospectos={prospectos.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          etapa: p.etapa,
          origen: p.origen,
          patrimonio_declarado: p.patrimonio_declarado,
          calificado: p.calificado,
          cliente_id: p.cliente_id,
        }))}
      />
    </div>
  );
}
