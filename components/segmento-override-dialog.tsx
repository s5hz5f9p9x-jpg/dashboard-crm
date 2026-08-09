"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { actualizarSegmentoManual } from "@/app/actions/clientes";
import type { Segmento } from "@/lib/db/schema";

const SIN_OVERRIDE = "__sin_override__";

export function SegmentoOverrideDialog({
  clienteId,
  segmentoManualActual,
  motivoActual,
}: {
  clienteId: string;
  segmentoManualActual: Segmento | null;
  motivoActual: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [segmento, setSegmento] = useState<string>(segmentoManualActual ?? SIN_OVERRIDE);
  const [motivo, setMotivo] = useState(motivoActual ?? "");

  function guardar() {
    if (segmento !== SIN_OVERRIDE && !motivo.trim()) {
      toast.error("El override de segmento necesita un motivo escrito.");
      return;
    }
    startTransition(async () => {
      try {
        await actualizarSegmentoManual(
          clienteId,
          segmento === SIN_OVERRIDE ? null : (segmento as Segmento),
          segmento === SIN_OVERRIDE ? null : motivo,
        );
        toast.success("Segmento actualizado.");
        setOpen(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo actualizar.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Override de segmento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Override manual de segmento</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Segmento</Label>
            <Select value={segmento} onValueChange={setSegmento}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SIN_OVERRIDE}>Sin override (usar el calculado)</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {segmento !== SIN_OVERRIDE && (
            <div className="space-y-1.5">
              <Label>Motivo (obligatorio)</Label>
              <Textarea
                placeholder="Ej: refiere mucho, cliente estratégico, etc."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={pending}>
            {pending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
