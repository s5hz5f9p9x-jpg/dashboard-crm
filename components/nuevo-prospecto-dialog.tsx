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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { crearProspecto } from "@/app/actions/prospectos";
import type { OrigenProspecto, PatrimonioDeclarado } from "@/lib/db/schema";

const ORIGENES: { value: OrigenProspecto; label: string }[] = [
  { value: "referido", label: "Referido" },
  { value: "linkedin_organico", label: "LinkedIn orgánico" },
  { value: "instagram_organico", label: "Instagram orgánico" },
  { value: "publicidad_instagram", label: "Publicidad Instagram" },
  { value: "publicidad_linkedin", label: "Publicidad LinkedIn" },
  { value: "newsletter", label: "Newsletter" },
  { value: "landing_directo", label: "Landing directo" },
  { value: "otro", label: "Otro" },
];

const PATRIMONIOS: { value: PatrimonioDeclarado; label: string }[] = [
  { value: "menos_20k", label: "Menos de US$ 20.000" },
  { value: "20k_50k", label: "US$ 20.000 – 50.000" },
  { value: "50k_150k", label: "US$ 50.000 – 150.000" },
  { value: "mas_150k", label: "Más de US$ 150.000" },
];

export function NuevoProspectoDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [origen, setOrigen] = useState<OrigenProspecto | "">("");
  const [patrimonio, setPatrimonio] = useState<PatrimonioDeclarado | "">("");
  const [objetivo, setObjetivo] = useState("");

  function limpiar() {
    setNombre("");
    setEmail("");
    setTelefono("");
    setOrigen("");
    setPatrimonio("");
    setObjetivo("");
  }

  function guardar() {
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    if (!origen) {
      toast.error("El origen es obligatorio: sin esto no se puede medir de dónde vienen los prospectos.");
      return;
    }
    startTransition(async () => {
      try {
        await crearProspecto({
          nombre,
          email: email || null,
          telefono: telefono || null,
          origen,
          patrimonio_declarado: patrimonio || null,
          objetivo: objetivo || null,
        });
        toast.success("Prospecto creado.");
        setOpen(false);
        limpiar();
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo crear el prospecto.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> Nuevo prospecto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo prospecto</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label>Nombre *</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Teléfono</Label>
            <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Origen *</Label>
            <Select value={origen} onValueChange={(v) => setOrigen(v as OrigenProspecto)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Elegí un origen" />
              </SelectTrigger>
              <SelectContent>
                {ORIGENES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Patrimonio declarado</Label>
            <Select value={patrimonio} onValueChange={(v) => setPatrimonio(v as PatrimonioDeclarado)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="(sin especificar)" />
              </SelectTrigger>
              <SelectContent>
                {PATRIMONIOS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>¿Qué te gustaría que pase con ese dinero?</Label>
            <Textarea value={objetivo} onChange={(e) => setObjetivo(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={pending}>
            {pending ? "Guardando..." : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
