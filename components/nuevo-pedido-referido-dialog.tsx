"use client";

import { useMemo, useState, useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { crearPedidoReferido } from "@/app/actions/referidos";
import type { CanalReferido, DisparadorUsadoReferido } from "@/lib/db/schema";

const DISPARADORES: { value: DisparadorUsadoReferido; label: string }[] = [
  { value: "reporte_buen_resultado", label: "Reporte con buen resultado" },
  { value: "agradecimiento_espontaneo", label: "Agradecimiento espontáneo" },
  { value: "aniversario", label: "Aniversario" },
  { value: "consulta_resuelta", label: "Consulta resuelta" },
  { value: "evento_mercado", label: "Evento de mercado" },
];

const CANALES: { value: CanalReferido; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "llamada", label: "Llamada" },
  { value: "presencial", label: "Presencial" },
];

export function NuevoPedidoReferidoDialog({ clientes }: { clientes: { id: string; nombre: string; apellido: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [disparador, setDisparador] = useState<DisparadorUsadoReferido | "">("");
  const [canal, setCanal] = useState<CanalReferido | "">("");

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return [];
    return clientes.filter((c) => `${c.apellido} ${c.nombre}`.toLowerCase().includes(q)).slice(0, 10);
  }, [busqueda, clientes]);

  const clienteElegido = clientes.find((c) => c.id === clienteId);

  function limpiar() {
    setBusqueda("");
    setClienteId(null);
    setDisparador("");
    setCanal("");
  }

  function guardar() {
    if (!clienteId) {
      toast.error("Elegí a qué cliente le vas a pedir el referido.");
      return;
    }
    if (!disparador || !canal) {
      toast.error("Elegí el disparador usado y el canal.");
      return;
    }
    startTransition(async () => {
      await crearPedidoReferido({ clienteId, disparadorUsado: disparador, canal });
      toast.success("Pedido registrado.");
      setOpen(false);
      limpiar();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> Registrar pedido
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pedido de referido</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            {clienteElegido ? (
              <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>
                  {clienteElegido.apellido}, {clienteElegido.nombre}
                </span>
                <Button size="sm" variant="ghost" onClick={() => setClienteId(null)}>
                  Cambiar
                </Button>
              </div>
            ) : (
              <>
                <Input placeholder="Buscar cliente por nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                {filtrados.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-md border">
                    {filtrados.map((c) => (
                      <button
                        key={c.id}
                        className="hover:bg-muted flex w-full px-3 py-2 text-left text-sm"
                        onClick={() => {
                          setClienteId(c.id);
                          setBusqueda("");
                        }}
                      >
                        {c.apellido}, {c.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Disparador usado</Label>
            <Select value={disparador} onValueChange={(v) => setDisparador(v as DisparadorUsadoReferido)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Elegí una opción" />
              </SelectTrigger>
              <SelectContent>
                {DISPARADORES.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Canal</Label>
            <Select value={canal} onValueChange={(v) => setCanal(v as CanalReferido)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Elegí una opción" />
              </SelectTrigger>
              <SelectContent>
                {CANALES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={pending}>
            {pending ? "Guardando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
