import { obtenerUltimaSincronizacion } from "@/app/actions/sincronizacion";
import { SincronizacionPanel } from "@/components/sincronizacion-panel";

export const dynamic = "force-dynamic";

export default async function SincronizacionPage() {
  const ultimaSincronizacion = await obtenerUltimaSincronizacion();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Sincronización</h1>
        <p className="text-muted-foreground text-sm">
          Trae el AUM actual de Supabase, lo convierte a USD con el MEP del momento y recalcula los segmentos. Nunca escribe en Supabase.
        </p>
      </div>
      <SincronizacionPanel ultimaSincronizacion={ultimaSincronizacion} />
    </div>
  );
}
