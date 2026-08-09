import { notFound } from "next/navigation";
import { obtenerDiagnostico } from "@/app/actions/diagnosticos";
import { DiagnosticoForm } from "@/components/diagnostico-form";

export const dynamic = "force-dynamic";

export default async function DiagnosticoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const datos = await obtenerDiagnostico(id);
  if (!datos) notFound();

  return (
    <div className="mx-auto max-w-3xl p-6">
      <DiagnosticoForm
        id={id}
        prospectoNombre={datos.prospecto?.nombre ?? "(prospecto eliminado)"}
        enviado={datos.diagnostico.enviado}
        valoresIniciales={{
          bloque_foto_actual: datos.diagnostico.bloque_foto_actual,
          bloque_riesgo_real: datos.diagnostico.bloque_riesgo_real,
          bloque_rendimiento: datos.diagnostico.bloque_rendimiento,
          bloque_huecos: datos.diagnostico.bloque_huecos,
          bloque_proximo_paso: datos.diagnostico.bloque_proximo_paso,
          minutos_produccion: datos.diagnostico.minutos_produccion,
        }}
      />
    </div>
  );
}
