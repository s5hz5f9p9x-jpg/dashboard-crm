"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { actualizarEstadoTarea } from "@/app/actions/plan90dias";
import type { EstadoTarea } from "@/lib/db/schema";

const ESTADO_LABEL: Record<EstadoTarea, string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  hecho: "Hecho",
  no_aplica: "No aplica",
};

export function TareaEstadoSelect({ id, estado }: { id: string; estado: EstadoTarea }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={estado}
      disabled={pending}
      onValueChange={(v) =>
        startTransition(async () => {
          await actualizarEstadoTarea(id, v as EstadoTarea);
          router.refresh();
        })
      }
    >
      <SelectTrigger className="h-7 w-32 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(ESTADO_LABEL) as EstadoTarea[]).map((e) => (
          <SelectItem key={e} value={e}>
            {ESTADO_LABEL[e]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
