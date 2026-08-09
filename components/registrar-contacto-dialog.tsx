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
import { MessageCirclePlus } from "lucide-react";
import { registrarContacto } from "@/app/actions/clientes";
import type { DireccionContacto, TipoContacto } from "@/lib/db/schema";

export function RegistrarContactoDialog({ clienteId }: { clienteId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [tipo, setTipo] = useState<TipoContacto>("whatsapp");
  const [direccion, setDireccion] = useState<DireccionContacto>("saliente");
  const [resumen, setResumen] = useState("");

  function guardar() {
    startTransition(async () => {
      await registrarContacto({ cliente_id: clienteId, tipo, direccion, resumen });
      toast.success("Contacto registrado.");
      setOpen(false);
      setResumen("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <MessageCirclePlus className="h-4 w-4" /> Registrar contacto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar contacto</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoContacto)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="llamada">Llamada</SelectItem>
                <SelectItem value="reunion">Reunión</SelectItem>
                <SelectItem value="reporte_enviado">Reporte enviado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Dirección</Label>
            <Select value={direccion} onValueChange={(v) => setDireccion(v as DireccionContacto)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="saliente">Saliente</SelectItem>
                <SelectItem value="entrante">Entrante</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Resumen</Label>
            <Textarea value={resumen} onChange={(e) => setResumen(e.target.value)} placeholder="Qué se habló, qué quedó pendiente..." />
          </div>
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
