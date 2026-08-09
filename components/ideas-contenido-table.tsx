"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { actualizarIdea } from "@/app/actions/contenido";
import type { EstadoContenido, PilarContenido, RendimientoContenido } from "@/lib/db/schema";
import { calcularPublicadasSobreTotal } from "@/lib/contenido";

export interface IdeaContenidoRow {
  id: string;
  pilar: PilarContenido;
  idea: string;
  canal_sugerido: string | null;
  estado: EstadoContenido;
  rendimiento: RendimientoContenido | null;
}

const PILAR_LABEL: Record<PilarContenido, string> = {
  traduccion: "Traducción",
  termometro: "Termómetro",
  prueba: "Prueba",
};
const ESTADO_LABEL: Record<EstadoContenido, string> = {
  pendiente: "Pendiente",
  escrita: "Escrita",
  publicada: "Publicada",
  promocionada: "Promocionada",
};
const RENDIMIENTO_LABEL: Record<RendimientoContenido, string> = { alto: "Alto", medio: "Medio", bajo: "Bajo" };

const TODOS = "__todos__";

function EstadoSelect({ id, estado }: { id: string; estado: EstadoContenido }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  return (
    <Select
      value={estado}
      onValueChange={(v) => startTransition(async () => {
        await actualizarIdea(id, { estado: v as EstadoContenido });
        router.refresh();
      })}
    >
      <SelectTrigger className="h-7 w-36 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(ESTADO_LABEL) as EstadoContenido[]).map((e) => (
          <SelectItem key={e} value={e}>
            {ESTADO_LABEL[e]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RendimientoSelect({ id, rendimiento }: { id: string; rendimiento: RendimientoContenido | null }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  return (
    <Select
      value={rendimiento ?? "__sin_dato__"}
      onValueChange={(v) => startTransition(async () => {
        await actualizarIdea(id, { rendimiento: v === "__sin_dato__" ? null : (v as RendimientoContenido) });
        router.refresh();
      })}
    >
      <SelectTrigger className="h-7 w-28 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__sin_dato__">—</SelectItem>
        {(Object.keys(RENDIMIENTO_LABEL) as RendimientoContenido[]).map((r) => (
          <SelectItem key={r} value={r}>
            {RENDIMIENTO_LABEL[r]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function IdeasContenidoTable({ ideas }: { ideas: IdeaContenidoRow[] }) {
  const [filtroPilar, setFiltroPilar] = useState(TODOS);
  const [filtroEstado, setFiltroEstado] = useState(TODOS);

  const filtradas = useMemo(
    () =>
      ideas.filter(
        (i) => (filtroPilar === TODOS || i.pilar === filtroPilar) && (filtroEstado === TODOS || i.estado === filtroEstado),
      ),
    [ideas, filtroPilar, filtroEstado],
  );

  const { publicadas, total } = calcularPublicadasSobreTotal(ideas);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Select value={filtroPilar} onValueChange={setFiltroPilar}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Pilar: todos</SelectItem>
              {(Object.keys(PILAR_LABEL) as PilarContenido[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {PILAR_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Estado: todos</SelectItem>
              {(Object.keys(ESTADO_LABEL) as EstadoContenido[]).map((e) => (
                <SelectItem key={e} value={e}>
                  {ESTADO_LABEL[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Badge variant="secondary">
          {publicadas} publicadas de {total}
        </Badge>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Idea</TableHead>
              <TableHead>Pilar</TableHead>
              <TableHead>Canal sugerido</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Rendimiento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="max-w-xs text-sm">{i.idea}</TableCell>
                <TableCell className="text-xs">{PILAR_LABEL[i.pilar]}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{i.canal_sugerido ?? "—"}</TableCell>
                <TableCell>
                  <EstadoSelect id={i.id} estado={i.estado} />
                </TableCell>
                <TableCell>
                  <RendimientoSelect id={i.id} rendimiento={i.rendimiento} />
                </TableCell>
              </TableRow>
            ))}
            {filtradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-6 text-center text-sm">
                  Sin ideas que coincidan con los filtros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
