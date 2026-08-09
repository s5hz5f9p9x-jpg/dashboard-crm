"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { actualizarDiagnostico, marcarDiagnosticoEnviado } from "@/app/actions/diagnosticos";

const BLOQUES = [
  { campo: "bloque_foto_actual" as const, titulo: "1. Foto actual", ayuda: "Cómo está compuesta la cartera hoy." },
  { campo: "bloque_riesgo_real" as const, titulo: "2. Riesgo real", ayuda: "El riesgo que realmente está tomando, más allá de lo que cree." },
  { campo: "bloque_rendimiento" as const, titulo: "3. Rendimiento", ayuda: "Cómo viene rindiendo, con contexto." },
  { campo: "bloque_huecos" as const, titulo: "4. Huecos", ayuda: "Lo que le falta a la cartera." },
  { campo: "bloque_proximo_paso" as const, titulo: "5. Próximo paso", ayuda: "La acción concreta sugerida." },
];

export function DiagnosticoForm({
  id,
  prospectoNombre,
  enviado,
  valoresIniciales,
}: {
  id: string;
  prospectoNombre: string;
  enviado: boolean;
  valoresIniciales: {
    bloque_foto_actual: string;
    bloque_riesgo_real: string;
    bloque_rendimiento: string;
    bloque_huecos: string;
    bloque_proximo_paso: string;
    minutos_produccion: number | null;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [valores, setValores] = useState(valoresIniciales);

  function guardar() {
    startTransition(async () => {
      await actualizarDiagnostico(id, valores);
      toast.success("Guardado.");
      router.refresh();
    });
  }

  function enviar() {
    startTransition(async () => {
      await marcarDiagnosticoEnviado(id);
      toast.success("Marcado como enviado.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Diagnóstico de {prospectoNombre}</h1>
          {enviado && (
            <Badge variant="secondary" className="mt-1">
              Enviado
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/diagnosticos/${id}/exportar`} target="_blank">
              <ExternalLink className="h-4 w-4" /> Exportar
            </Link>
          </Button>
          {!enviado && (
            <Button size="sm" variant="outline" onClick={enviar} disabled={pending}>
              Marcar enviado
            </Button>
          )}
        </div>
      </div>

      {BLOQUES.map((b) => (
        <Card key={b.campo}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{b.titulo}</CardTitle>
            <p className="text-muted-foreground text-xs">{b.ayuda}</p>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={3}
              value={valores[b.campo]}
              onChange={(e) => setValores((v) => ({ ...v, [b.campo]: e.target.value }))}
            />
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Minutos de producción</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="number"
            className="w-32"
            value={valores.minutos_produccion ?? ""}
            onChange={(e) => setValores((v) => ({ ...v, minutos_produccion: e.target.value === "" ? null : Number(e.target.value) }))}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Label className="sr-only">Guardar diagnóstico</Label>
        <Button onClick={guardar} disabled={pending}>
          {pending ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
