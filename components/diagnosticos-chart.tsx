"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function DiagnosticosChart({ diagnosticos }: { diagnosticos: { fechaSolicitud: string; minutosProduccion: number | null }[] }) {
  const data = [...diagnosticos]
    .filter((d) => d.minutosProduccion !== null)
    .sort((a, b) => (a.fechaSolicitud < b.fechaSolicitud ? -1 : 1))
    .map((d, i) => ({ n: `#${i + 1}`, minutos: d.minutosProduccion }));

  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center rounded-md border border-dashed text-sm">
        Todavía no hay minutos de producción cargados.
      </div>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="n" fontSize={12} />
          <YAxis fontSize={12} unit=" min" />
          <Tooltip />
          <Line type="monotone" dataKey="minutos" stroke="var(--primary)" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
