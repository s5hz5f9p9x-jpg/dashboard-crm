import { calcularProporcionPilares } from "@/lib/contenido";
import { formatPct } from "@/lib/format";
import type { PilarContenido } from "@/lib/db/schema";

const PILAR_LABEL: Record<PilarContenido, string> = {
  traduccion: "Traducción",
  termometro: "Termómetro",
  prueba: "Prueba",
};

export function ProporcionPilares({ ideas }: { ideas: { pilar: PilarContenido }[] }) {
  const proporciones = calcularProporcionPilares(ideas);

  return (
    <div className="space-y-3">
      {proporciones.map((p) => (
        <div key={p.pilar}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium">{PILAR_LABEL[p.pilar]}</span>
            <span className="text-muted-foreground">
              {p.cantidad} · {formatPct(p.pctReal)} (objetivo {formatPct(p.pctObjetivo)})
            </span>
          </div>
          <div className="bg-muted relative h-2 overflow-hidden rounded-full">
            <div className="bg-primary absolute inset-y-0 left-0 rounded-full" style={{ width: `${(p.pctReal ?? 0) * 100}%` }} />
            <div className="absolute inset-y-0 w-px bg-black/40 dark:bg-white/60" style={{ left: `${p.pctObjetivo * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
