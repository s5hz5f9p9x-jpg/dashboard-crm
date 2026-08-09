import { obtenerEstadoVinculacion } from "@/app/actions/vinculacion";
import { VinculacionPanel } from "@/components/vinculacion-panel";

export const dynamic = "force-dynamic";

export default async function VinculacionPage() {
  const estado = await obtenerEstadoVinculacion();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Vinculación con Supabase</h1>
        <p className="text-muted-foreground text-sm">
          Confirmá a mano qué cuenta de Supabase corresponde a cada cliente. Nunca se vincula automático.
        </p>
      </div>
      <VinculacionPanel estado={estado} />
    </div>
  );
}
