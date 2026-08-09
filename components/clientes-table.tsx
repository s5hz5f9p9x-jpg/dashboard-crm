"use client";

import { useMemo, useState, useTransition } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SegmentoBadge } from "@/components/segmento-badge";
import { SemaforoDot } from "@/components/semaforo-dot";
import { NuevoClienteDialog } from "@/components/nuevo-cliente-dialog";
import { formatUSD } from "@/lib/format";
import { recalcularSegmentosAction } from "@/app/actions/clientes";
import type { ClienteConEstado } from "@/lib/clientes";
import { RefreshCw } from "lucide-react";

const TODOS = "__todos__";

function exportarCSV(filas: ClienteConEstado[]) {
  const encabezados = ["Nombre", "Apellido", "Email", "Segmento", "Nivel", "AUM USD", "Estado", "Semáforo", "Fecha alta"];
  const lineas = filas.map((f) =>
    [f.nombre, f.apellido, f.email ?? "", f.segmento_manual ?? f.segmento, f.nivel_servicio, f.aum_actual_usd, f.estado, f.semaforo, f.fecha_alta]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  const csv = [encabezados.join(","), ...lineas].join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ClientesTable({ data }: { data: ClienteConEstado[] }) {
  const router = useRouter();
  const [segmento, setSegmento] = useState(TODOS);
  const [nivel, setNivel] = useState(TODOS);
  const [estado, setEstado] = useState(TODOS);
  const [semaforo, setSemaforo] = useState(TODOS);
  const [pending, startTransition] = useTransition();

  const filtrados = useMemo(() => {
    return data.filter((c) => {
      const segEfectivo = c.segmento_manual ?? c.segmento;
      if (segmento !== TODOS && segEfectivo !== segmento) return false;
      if (nivel !== TODOS && c.nivel_servicio !== nivel) return false;
      if (estado !== TODOS && c.estado !== estado) return false;
      if (semaforo !== TODOS && c.semaforo !== semaforo) return false;
      return true;
    });
  }, [data, segmento, nivel, estado, semaforo]);

  const columns = useMemo<ColumnDef<ClienteConEstado>[]>(
    () => [
      {
        id: "nombre",
        header: "Nombre",
        accessorFn: (c) => `${c.apellido} ${c.nombre}`,
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.apellido}, {row.original.nombre}
          </span>
        ),
      },
      {
        id: "segmento",
        header: "Segmento",
        accessorFn: (c) => c.segmento_manual ?? c.segmento,
        cell: ({ row }) => (
          <SegmentoBadge
            segmento={row.original.segmento_manual ?? row.original.segmento}
            manual={!!row.original.segmento_manual}
          />
        ),
      },
      {
        id: "nivel_servicio",
        header: "Nivel",
        accessorKey: "nivel_servicio",
        cell: ({ getValue }) => <span className="capitalize">{getValue<string>()}</span>,
      },
      {
        id: "aum",
        header: "AUM",
        accessorKey: "aum_actual_usd",
        cell: ({ getValue }) => formatUSD(getValue<number>()),
      },
      {
        id: "ultimo_contacto",
        header: "Último contacto",
        accessorKey: "diasDesdeUltimoContacto",
        cell: ({ row }) => `hace ${row.original.diasDesdeUltimoContacto} días`,
      },
      {
        id: "semaforo",
        header: "Semáforo",
        accessorKey: "semaforo",
        cell: ({ row }) => <SemaforoDot semaforo={row.original.semaforo} />,
      },
      {
        id: "estado",
        header: "Estado",
        accessorKey: "estado",
        cell: ({ getValue }) => <span className="capitalize">{getValue<string>()}</span>,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filtrados,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  function handleRecalcular() {
    startTransition(async () => {
      const res = await recalcularSegmentosAction();
      toast.success(`Segmentos recalculados: ${res.cambios} cambios sobre ${res.total} clientes.`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <FiltroSelect label="Segmento" value={segmento} onChange={setSegmento} opciones={["A", "B", "C"]} />
          <FiltroSelect label="Nivel" value={nivel} onChange={setNivel} opciones={["base", "plus", "privado"]} />
          <FiltroSelect label="Estado" value={estado} onChange={setEstado} opciones={["activo", "pausado", "baja"]} />
          <FiltroSelect label="Semáforo" value={semaforo} onChange={setSemaforo} opciones={["verde", "amarillo", "rojo"]} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRecalcular} disabled={pending}>
            <RefreshCw className={pending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Recalcular segmentos
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportarCSV(filtrados)}>
            Exportar CSV
          </Button>
          <NuevoClienteDialog />
        </div>
      </div>

      <div className="text-muted-foreground text-sm">{filtrados.length} de {data.length} clientes</div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-muted-foreground py-8 text-center">
                  No hay clientes que coincidan con los filtros.
                </TableCell>
              </TableRow>
            )}
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => router.push(`/clientes/${row.original.id}`)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function FiltroSelect({
  label,
  value,
  onChange,
  opciones,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  opciones: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-36">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={TODOS}>{label}: todos</SelectItem>
        {opciones.map((o) => (
          <SelectItem key={o} value={o} className="capitalize">
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
