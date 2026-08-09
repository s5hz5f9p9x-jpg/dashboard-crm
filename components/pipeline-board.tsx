"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { ETAPAS_PIPELINE } from "@/lib/prospectos";
import { moverEtapaProspecto, convertirEnCliente } from "@/app/actions/prospectos";
import type { EtapaProspecto } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export interface ProspectoPipeline {
  id: string;
  nombre: string;
  etapa: EtapaProspecto;
  origen: string;
  patrimonio_declarado: string | null;
  calificado: boolean;
  cliente_id: string | null;
}

export function PipelineBoard({ prospectos }: { prospectos: ProspectoPipeline[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobreColumna, setSobreColumna] = useState<EtapaProspecto | null>(null);

  function mover(prospectoId: string, nuevaEtapa: EtapaProspecto) {
    startTransition(async () => {
      await moverEtapaProspecto(prospectoId, nuevaEtapa);
      router.refresh();
    });
  }

  function handleDrop(etapa: EtapaProspecto) {
    setSobreColumna(null);
    if (!arrastrando) return;
    const prospecto = prospectos.find((p) => p.id === arrastrando);
    setArrastrando(null);
    if (!prospecto || prospecto.etapa === etapa) return;
    mover(prospecto.id, etapa);
  }

  function convertir(prospectoId: string) {
    startTransition(async () => {
      const clienteId = await convertirEnCliente(prospectoId);
      toast.success("Convertido en cliente.");
      router.push(`/clientes/${clienteId}`);
    });
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {ETAPAS_PIPELINE.map(({ etapa, etiqueta }) => {
        const items = prospectos.filter((p) => p.etapa === etapa);
        return (
          <div
            key={etapa}
            className={cn(
              "w-64 shrink-0 rounded-md border bg-muted/30 p-2",
              sobreColumna === etapa && "ring-primary ring-2",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setSobreColumna(etapa);
            }}
            onDragLeave={() => setSobreColumna((s) => (s === etapa ? null : s))}
            onDrop={() => handleDrop(etapa)}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-sm font-medium">{etiqueta}</span>
              <Badge variant="outline">{items.length}</Badge>
            </div>
            <div className="space-y-2">
              {items.map((p) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={() => setArrastrando(p.id)}
                  onDragEnd={() => setArrastrando(null)}
                  className={cn(
                    "bg-background cursor-grab space-y-1 rounded-md border p-2 text-sm shadow-sm active:cursor-grabbing",
                    arrastrando === p.id && "opacity-50",
                  )}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-medium">{p.nombre}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="-mt-1 -mr-1 h-6 w-6 shrink-0">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {ETAPAS_PIPELINE.filter((e) => e.etapa !== p.etapa).map((e) => (
                          <DropdownMenuItem key={e.etapa} onSelect={() => mover(p.id, e.etapa)}>
                            Mover a: {e.etiqueta}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {p.origen}
                    </Badge>
                    {p.patrimonio_declarado && (
                      <Badge variant={p.calificado ? "secondary" : "outline"} className="text-[10px]">
                        {p.calificado ? "Calificado" : "No calificado"}
                      </Badge>
                    )}
                  </div>
                  {etapa === "ganado" && !p.cliente_id && (
                    <Button size="sm" className="w-full" disabled={pending} onClick={() => convertir(p.id)}>
                      Convertir en cliente
                    </Button>
                  )}
                  {p.cliente_id && (
                    <Link href={`/clientes/${p.cliente_id}`} className="text-primary block text-xs hover:underline">
                      Ver cliente →
                    </Link>
                  )}
                </div>
              ))}
              {items.length === 0 && <p className="text-muted-foreground px-1 text-xs">Sin prospectos</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
