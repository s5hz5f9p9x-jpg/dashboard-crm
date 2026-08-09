"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatFecha, formatUSD } from "@/lib/format";

export function AumChart({ snapshots }: { snapshots: { fecha: string; aum_usd: number }[] }) {
  if (snapshots.length === 0) {
    return (
      <div className="text-muted-foreground flex h-48 items-center justify-center rounded-md border border-dashed text-sm">
        Todavía no hay historial de AUM. Se va a empezar a completar al sincronizar con Supabase (Etapa 2).
      </div>
    );
  }

  const data = [...snapshots].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="fecha" tickFormatter={(v) => formatFecha(v)} fontSize={12} />
          <YAxis tickFormatter={(v) => formatUSD(v)} fontSize={12} width={90} />
          <Tooltip formatter={(v) => formatUSD(Number(v))} labelFormatter={(v) => formatFecha(v as string)} />
          <Line type="monotone" dataKey="aum_usd" stroke="var(--primary)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
