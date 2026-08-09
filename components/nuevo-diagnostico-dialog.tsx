"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { crearDiagnostico } from "@/app/actions/diagnosticos";

export function NuevoDiagnosticoDialog({ prospectos }: { prospectos: { id: string; nombre: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return prospectos.slice(0, 30);
    return prospectos.filter((p) => p.nombre.toLowerCase().includes(q)).slice(0, 30);
  }, [busqueda, prospectos]);

  function elegir(prospectoId: string) {
    startTransition(async () => {
      const id = await crearDiagnostico({ prospectoId });
      toast.success("Diagnóstico creado.");
      setOpen(false);
      router.push(`/diagnosticos/${id}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Nuevo diagnóstico
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Elegir prospecto</DialogTitle>
        </DialogHeader>
        <Input placeholder="Buscar prospecto por nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        <div className="max-h-72 overflow-y-auto">
          {filtrados.map((p) => (
            <button
              key={p.id}
              disabled={pending}
              className="hover:bg-muted flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm"
              onClick={() => elegir(p.id)}
            >
              {p.nombre}
            </button>
          ))}
          {filtrados.length === 0 && <p className="text-muted-foreground p-2 text-sm">Sin resultados. Cargalo primero en el Pipeline.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
