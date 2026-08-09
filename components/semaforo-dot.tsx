import type { Semaforo } from "@/lib/semaforo";
import { cn } from "@/lib/utils";

const COLORES: Record<Semaforo, string> = {
  verde: "var(--pos)",
  amarillo: "var(--warn)",
  rojo: "var(--neg-soft)",
};

export function SemaforoDot({ semaforo, className }: { semaforo: Semaforo; className?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-full", className)} style={{ background: COLORES[semaforo] }} />
      <span className="text-xs capitalize" style={{ color: "var(--text-3)" }}>
        {semaforo}
      </span>
    </span>
  );
}
