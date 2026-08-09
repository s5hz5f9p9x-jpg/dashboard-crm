"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Database } from "lucide-react";
import { formatPct, formatUSD } from "@/lib/format";
import { actualizarMetricaSemanal } from "@/app/actions/metricas";
import type { MetricaSemanaCompleta } from "@/app/actions/metricas";

type CampoManual = "alcance_perfil_objetivo" | "visitas_perfil" | "inversion_publicitaria_usd";

const FILAS_CALCULADAS: { label: string; get: (m: MetricaSemanaCompleta) => number }[] = [
  { label: "Leads captados", get: (m) => m.leadsCaptados },
  { label: "Leads calificados", get: (m) => m.leadsCalificados },
  { label: "Llamadas agendadas", get: (m) => m.llamadasAgendadas },
  { label: "Llamadas realizadas", get: (m) => m.llamadasRealizadas },
  { label: "Clientes nuevos", get: (m) => m.clientesNuevos },
];

const FILAS_TASAS = [
  ["Tasa de calificación", (m: MetricaSemanaCompleta) => formatPct(m.tasas.tasaCalificacion)],
  ["Tasa de asistencia", (m: MetricaSemanaCompleta) => formatPct(m.tasas.tasaAsistencia)],
  ["Tasa de cierre", (m: MetricaSemanaCompleta) => formatPct(m.tasas.tasaCierre)],
  ["Costo por lead calificado", (m: MetricaSemanaCompleta) => (m.tasas.costoLeadCalificado === null ? "—" : formatUSD(m.tasas.costoLeadCalificado))],
  ["CAC canal pago", (m: MetricaSemanaCompleta) => (m.tasas.cacCanalPago === null ? "—" : formatUSD(m.tasas.cacCanalPago))],
] as const;

// Componente propio (no anidado adentro de MetricasTable) — si se define adentro,
// React lo trata como un tipo nuevo en cada re-render y remonta el <input> en
// cada tecla, perdiendo el foco antes de que el blur llegue a dispararse.
function ManualInput({
  semana,
  campo,
  valorActual,
}: {
  semana: number;
  campo: CampoManual;
  valorActual: number | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function guardar(valor: string) {
    const num = valor === "" ? null : Number(valor);
    startTransition(async () => {
      await actualizarMetricaSemanal(semana, { [campo]: campo === "inversion_publicitaria_usd" ? (num ?? 0) : num });
      router.refresh();
    });
  }

  return (
    <Input
      key={valorActual ?? "vacio"}
      type="number"
      className="h-7 w-20 text-xs"
      defaultValue={valorActual ?? ""}
      onBlur={(e) => guardar(e.target.value)}
    />
  );
}

export function MetricasTable({ metricas }: { metricas: MetricaSemanaCompleta[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="bg-background sticky left-0 z-10">Métrica</TableHead>
            {metricas.map((m) => (
              <TableHead key={m.semana} className="text-center whitespace-nowrap">
                Sem {m.semana}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="bg-background sticky left-0 z-10 text-xs">Alcance perfil objetivo</TableCell>
            {metricas.map((m) => (
              <TableCell key={m.semana} className="text-center">
                <ManualInput semana={m.semana} campo="alcance_perfil_objetivo" valorActual={m.alcancePerfilObjetivo} />
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="bg-background sticky left-0 z-10 text-xs">Visitas al perfil</TableCell>
            {metricas.map((m) => (
              <TableCell key={m.semana} className="text-center">
                <ManualInput semana={m.semana} campo="visitas_perfil" valorActual={m.visitasPerfil} />
              </TableCell>
            ))}
          </TableRow>

          {FILAS_CALCULADAS.map((fila) => (
            <TableRow key={fila.label}>
              <TableCell className="bg-background sticky left-0 z-10 text-xs">
                <span className="inline-flex items-center gap-1">
                  <Database className="text-muted-foreground h-3 w-3" /> {fila.label}
                </span>
              </TableCell>
              {metricas.map((m) => (
                <TableCell key={m.semana} className="text-center text-sm">
                  {fila.get(m)}
                </TableCell>
              ))}
            </TableRow>
          ))}

          <TableRow>
            <TableCell className="bg-background sticky left-0 z-10 text-xs">Inversión publicitaria (US$)</TableCell>
            {metricas.map((m) => (
              <TableCell key={m.semana} className="text-center">
                <ManualInput semana={m.semana} campo="inversion_publicitaria_usd" valorActual={m.inversionPublicitariaUsd} />
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>

      <div className="border-t p-3">
        <p className="text-muted-foreground mb-2 text-xs font-medium">Tasas derivadas por semana</p>
        <Table>
          <TableBody>
            {FILAS_TASAS.map(([label, fn]) => (
              <TableRow key={label}>
                <TableCell className="bg-background sticky left-0 z-10 text-xs">{label}</TableCell>
                {metricas.map((m) => (
                  <TableCell key={m.semana} className="text-center text-xs">
                    {fn(m)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
