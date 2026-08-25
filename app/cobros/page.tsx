import { obtenerCobrosSemana } from "@/app/actions/cobros";
import { CobrosPanel } from "@/components/cobros-panel";

export const dynamic = "force-dynamic";

export default async function CobrosPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
}) {
  const { semana } = await searchParams;
  const datos = await obtenerCobrosSemana(semana);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-black" style={{ letterSpacing: "-0.01em" }}>
          Cobros de la semana
        </h1>
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          Quién cobra renta o amortización, calculado con los nominales de cada cliente y los cronogramas cargados.
        </p>
      </div>

      <CobrosPanel datos={datos} />
    </div>
  );
}
