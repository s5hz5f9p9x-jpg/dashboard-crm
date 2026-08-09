import { notFound } from "next/navigation";
import { obtenerDiagnostico } from "@/app/actions/diagnosticos";
import { formatFecha } from "@/lib/format";

export const dynamic = "force-dynamic";

const BLOQUES = [
  { campo: "bloque_foto_actual" as const, titulo: "Foto actual" },
  { campo: "bloque_riesgo_real" as const, titulo: "Riesgo real" },
  { campo: "bloque_rendimiento" as const, titulo: "Rendimiento" },
  { campo: "bloque_huecos" as const, titulo: "Huecos" },
  { campo: "bloque_proximo_paso" as const, titulo: "Próximo paso" },
];

export default async function ExportarDiagnosticoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const datos = await obtenerDiagnostico(id);
  if (!datos) notFound();

  const { diagnostico, prospecto } = datos;

  return (
    <div className="mx-auto max-w-2xl p-10 print:p-0">
      <div className="mb-8 flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Driver Capital</h1>
          <p className="text-muted-foreground text-sm">Diagnóstico de Cartera</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-medium">{prospecto?.nombre ?? "—"}</p>
          <p className="text-muted-foreground">{formatFecha(diagnostico.fecha_entrega ?? diagnostico.fecha_solicitud)}</p>
        </div>
      </div>

      <div className="space-y-5">
        {BLOQUES.map((b) => (
          <div key={b.campo}>
            <h2 className="mb-1 text-sm font-semibold">{b.titulo}</h2>
            <p className="text-sm whitespace-pre-wrap">{diagnostico[b.campo] || "—"}</p>
          </div>
        ))}
      </div>

      <div className="text-muted-foreground mt-10 border-t pt-4 text-[10px] leading-relaxed">
        Este documento tiene fines informativos. No constituye una recomendación personalizada de inversión ni una oferta
        de compra o venta de instrumentos financieros. Toda inversión conlleva riesgos, incluida la posible pérdida del
        capital invertido. Los rendimientos pasados no garantizan resultados futuros.
      </div>

      <div className="no-print mt-6 text-center">
        <p className="text-muted-foreground text-xs">Usá Cmd/Ctrl+P para imprimir o guardar como PDF.</p>
      </div>
    </div>
  );
}
