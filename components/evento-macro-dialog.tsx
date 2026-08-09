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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone } from "lucide-react";
import { crearEventoMacro } from "@/app/actions/disparadores";

export function EventoMacroDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [titulo, setTitulo] = useState("");
  const [detalle, setDetalle] = useState("");

  function guardar() {
    if (!titulo.trim()) {
      toast.error("El título es obligatorio.");
      return;
    }
    startTransition(async () => {
      await crearEventoMacro({ titulo, detalle, accionSugerida: "Enviar comunicación a la base", severidad: "alta" });
      toast.success("Evento macro creado.");
      setOpen(false);
      setTitulo("");
      setDetalle("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Megaphone className="h-4 w-4" /> Evento macro
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo evento macro</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Suba de tasas de la Fed" />
          </div>
          <div className="space-y-1.5">
            <Label>Detalle</Label>
            <Textarea value={detalle} onChange={(e) => setDetalle(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={pending}>
            {pending ? "Creando..." : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
