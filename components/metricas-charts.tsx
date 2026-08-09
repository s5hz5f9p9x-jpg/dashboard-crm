"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MetricaSemanaCompleta } from "@/app/actions/metricas";
import { formatUSD } from "@/lib/format";

export function LeadsCalificadosChart({ metricas }: { metricas: MetricaSemanaCompleta[] }) {
  const data = metricas.map((m) => ({ semana: `S${m.semana}`, leads: m.leadsCalificados }));
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="semana" fontSize={12} />
          <YAxis fontSize={12} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="leads" fill="var(--primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CacComparisonChart({ cacReal, cacMaximo }: { cacReal: number | null; cacMaximo: number }) {
  const data = [{ nombre: "CAC", real: cacReal ?? 0, maximo: cacMaximo }];
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" tickFormatter={(v) => formatUSD(v)} fontSize={12} />
          <YAxis type="category" dataKey="nombre" fontSize={12} />
          <Tooltip formatter={(v) => formatUSD(Number(v))} />
          <Bar dataKey="maximo" name="CAC máximo tolerable" fill="var(--muted-foreground)" radius={[0, 4, 4, 0]} barSize={18} />
          <Bar dataKey="real" name="CAC real" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
