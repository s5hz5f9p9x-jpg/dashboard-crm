import { listarProspectos } from "@/app/actions/prospectos";
import { PipelineBoard } from "@/components/pipeline-board";
import { NuevoProspectoDialog } from "@/components/nuevo-prospecto-dialog";

export const dynamic = "force-dynamic";

function diasDesde(fechaISO: string): number {
  const desde = new Date(`${fechaISO}T00:00:00`);
  if (Number.isNaN(desde.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - desde.getTime()) / 86_400_000));
}

export default async function PipelinePage() {
  const prospectos = await listarProspectos();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ letterSpacing: "-0.01em" }}>
            Pipeline
          </h1>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            El embudo se lee de arriba hacia abajo. Arrastrá una tarjeta a otra etapa, o usá el menú «...».
          </p>
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
          diasEnPipeline: diasDesde(p.fecha_ingreso),
        }))}
      />
    </div>
  );
}
