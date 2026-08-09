import type { Segmento } from "@/lib/db/schema";

const ESTILOS: Record<Segmento, { color: string; background: string }> = {
  A: { color: "var(--green)", background: "var(--green-tint)" },
  B: { color: "var(--warn)", background: "rgba(224,160,42,.18)" },
  C: { color: "var(--text-3)", background: "rgba(243,243,233,.08)" },
};

export function SegmentoBadge({ segmento, manual }: { segmento: Segmento; manual?: boolean }) {
  const estilo = ESTILOS[segmento];
  return (
    <span className="chip font-bold" style={{ color: estilo.color, background: estilo.background }}>
      {segmento}
      {manual && <span className="text-[10px] font-normal opacity-70">(manual)</span>}
    </span>
  );
}
