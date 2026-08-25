"use client";

import { useMemo, useState, useTransition } from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { NuevoClienteDialog } from "@/components/nuevo-cliente-dialog";
import { formatUSD } from "@/lib/format";
import { recalcularSegmentosAction } from "@/app/actions/clientes";
import type { ClienteConEstado } from "@/lib/clientes";
import { RefreshCw, Search, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";

const TODOS = "__todos__";
const POR_PAGINA = 50;

const SEMAFORO_COLOR: Record<string, string> = {
  verde: "var(--pos)",
  amarillo: "var(--warn)",
  rojo: "var(--neg-soft)",
};

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
  const [busqueda, setBusqueda] = useState("");
  const [segmento, setSegmento] = useState(TODOS);
  const [nivel, setNivel] = useState(TODOS);
  const [estado, setEstado] = useState(TODOS);
  const [semaforo, setSemaforo] = useState(TODOS);
  // Por defecto los de mayor AUM arriba: es el orden en el que conviene mirarlos.
  const [sorting, setSorting] = useState<SortingState>([{ id: "aum", desc: true }]);
  const [pending, startTransition] = useTransition();

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return data.filter((c) => {
      const segEfectivo = c.segmento_manual ?? c.segmento;
      if (segmento !== TODOS && segEfectivo !== segmento) return false;
      if (nivel !== TODOS && c.nivel_servicio !== nivel) return false;
      if (estado !== TODOS && c.estado !== estado) return false;
      if (semaforo !== TODOS && c.semaforo !== semaforo) return false;
      if (q && !`${c.apellido} ${c.nombre} ${c.email ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, busqueda, segmento, nivel, estado, semaforo]);

  const resumen = useMemo(() => {
    const activos = filtrados.filter((c) => c.estado === "activo");
    // Los dados de baja ya no están bajo gestión, así que no suman al AUM.
    const aumTotal = filtrados.filter((c) => c.estado !== "baja").reduce((acc, c) => acc + c.aum_actual_usd, 0);
    const conAum = activos.filter((c) => c.aum_actual_usd > 0);
    return {
      aumTotal,
      activos: activos.length,
      ticketPromedio: conAum.length ? conAum.reduce((a, c) => a + c.aum_actual_usd, 0) / conAum.length : 0,
      enRojo: activos.filter((c) => c.semaforo === "rojo").length,
    };
  }, [filtrados]);

  const columns = useMemo<ColumnDef<ClienteConEstado>[]>(
    () => [
      {
        id: "nombre",
        header: "Nombre",
        accessorFn: (c) => `${c.apellido} ${c.nombre}`,
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold">
                  {c.apellido}, {c.nombre}
                </span>
                {/* El nivel sólo se muestra cuando no es el default, si no es ruido en todas las filas. */}
                {c.nivel_servicio !== "base" && (
                  <span className="chip capitalize" style={{ background: "var(--navy-tint)", color: "var(--navy)" }}>
                    {c.nivel_servicio}
                  </span>
                )}
              </div>
              {c.email && (
                <div className="truncate text-[11px]" style={{ color: "var(--text-4)" }}>
                  {c.email}
                </div>
              )}
            </div>
          );
        },
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
        id: "aum",
        header: "AUM",
        accessorKey: "aum_actual_usd",
        cell: ({ getValue }) => {
          const v = getValue<number>();
          return (
            <span
              className="num tabular-nums"
              style={{ color: v < 0 ? "var(--neg-soft)" : v === 0 ? "var(--text-4)" : "var(--text)" }}
            >
              {formatUSD(v)}
            </span>
          );
        },
      },
      {
        id: "ultimo_contacto",
        header: "Último contacto",
        accessorKey: "diasDesdeUltimoContacto",
        cell: ({ row }) =>
          row.original.tuvoContacto ? (
            <span className="num text-sm">hace {row.original.diasDesdeUltimoContacto} días</span>
          ) : (
            <span className="text-xs" style={{ color: "var(--text-4)" }} title="Nunca se registró un contacto con este cliente">
              sin registrar
            </span>
          ),
      },
      {
        id: "semaforo",
        header: "Semáforo",
        accessorKey: "semaforo",
        cell: ({ row }) => (
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: SEMAFORO_COLOR[row.original.semaforo] }}
            title={row.original.semaforo}
          />
        ),
      },
      {
        id: "estado",
        header: "Estado",
        accessorKey: "estado",
        cell: ({ getValue }) => {
          const v = getValue<string>();
          return (
            <span
              className="text-xs capitalize"
              style={{ color: v === "activo" ? "var(--text-2)" : "var(--text-4)" }}
            >
              {v}
            </span>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filtrados,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: POR_PAGINA } },
  });

  function handleRecalcular() {
    startTransition(async () => {
      const res = await recalcularSegmentosAction();
      toast.success(`Segmentos recalculados: ${res.cambios} cambios sobre ${res.total} clientes.`);
      router.refresh();
    });
  }

  const hayFiltro = busqueda.trim() !== "" || [segmento, nivel, estado, semaforo].some((f) => f !== TODOS);
  const paginaActual = table.getState().pagination.pageIndex + 1;
  const totalPaginas = Math.max(1, table.getPageCount());

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label={hayFiltro ? "AUM filtrado" : "AUM total"} valor={formatUSD(resumen.aumTotal)} />
        <Kpi label="Activos" valor={String(resumen.activos)} />
        <Kpi label="Ticket promedio" valor={formatUSD(resumen.ticketPromedio)} />
        <Kpi label="Contacto vencido" valor={String(resumen.enRojo)} color={resumen.enRojo ? "var(--neg-soft)" : undefined} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--text-4)" }}
          />
          <Input
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              table.setPageIndex(0);
            }}
            placeholder="Buscar por nombre o email..."
            className="pl-9"
          />
        </div>
        <FiltroSelect label="Segmento" value={segmento} onChange={setSegmento} opciones={["A", "B", "C"]} />
        <FiltroSelect label="Estado" value={estado} onChange={setEstado} opciones={["activo", "pausado", "baja"]} />
        <FiltroSelect label="Semáforo" value={semaforo} onChange={setSemaforo} opciones={["verde", "amarillo", "rojo"]} />
        <FiltroSelect label="Nivel" value={nivel} onChange={setNivel} opciones={["base", "plus", "privado"]} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="num text-sm" style={{ color: "var(--text-4)" }}>
          {filtrados.length}
          {filtrados.length !== data.length && ` de ${data.length}`} clientes
        </span>
        <div className="flex flex-wrap gap-2">
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

      {/* En celular la tabla obliga a scrollear de costado, así que ahí se muestran tarjetas. */}
      <div className="space-y-2 sm:hidden">
        {table.getRowModel().rows.length === 0 && (
          <p className="py-8 text-center text-sm" style={{ color: "var(--text-4)" }}>
            No hay clientes que coincidan.
          </p>
        )}
        {table.getRowModel().rows.map((row) => {
          const c = row.original;
          return (
            <button
              key={row.id}
              onClick={() => router.push(`/clientes/${c.id}`)}
              className="card flex w-full items-center gap-3 p-3 text-left"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: SEMAFORO_COLOR[c.semaforo] }}
                title={c.semaforo}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">
                  {c.apellido}, {c.nombre}
                </p>
                <p className="num truncate text-[11px]" style={{ color: "var(--text-4)" }}>
                  {c.tuvoContacto ? `hace ${c.diasDesdeUltimoContacto} días` : "sin contacto"}
                  {c.estado !== "activo" && ` · ${c.estado}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className="num text-[13px] font-semibold"
                  style={{
                    color:
                      c.aum_actual_usd < 0
                        ? "var(--neg-soft)"
                        : c.aum_actual_usd === 0
                          ? "var(--text-4)"
                          : "var(--text)",
                  }}
                >
                  {formatUSD(c.aum_actual_usd)}
                </span>
                <SegmentoBadge segmento={c.segmento_manual ?? c.segmento} manual={!!c.segmento_manual} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="card hidden overflow-hidden p-0 sm:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((h) => {
                  const orden = h.column.getIsSorted();
                  return (
                    <TableHead key={h.id} className="h-11">
                      <button
                        type="button"
                        onClick={h.column.getToggleSortingHandler()}
                        className="label flex items-center gap-1 transition-colors hover:text-[var(--text-2)]"
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {orden === "asc" && <ArrowUp className="h-3 w-3" style={{ color: "var(--green)" }} />}
                        {orden === "desc" && <ArrowDown className="h-3 w-3" style={{ color: "var(--green)" }} />}
                      </button>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center" style={{ color: "var(--text-4)" }}>
                  No hay clientes que coincidan.
                </TableCell>
              </TableRow>
            )}
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
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

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="num text-sm" style={{ color: "var(--text-3)" }}>
            {paginaActual} / {totalPaginas}
          </span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, valor, color }: { label: string; valor: string; color?: string }) {
  return (
    <div className="card px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="label text-[10px] sm:text-[11px]">{label}</div>
      <div
        className="num mt-1.5 truncate text-base font-semibold sm:text-xl"
        style={{ color: color ?? "var(--text)" }}
        title={valor}
      >
        {valor}
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
      <SelectTrigger className="w-[130px]">
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
