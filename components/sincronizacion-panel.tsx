"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Wifi } from "lucide-react";
import { probarConexion, sincronizarAum, type ResultadoSincronizacion } from "@/app/actions/sincronizacion";
import { formatFecha, formatUSD } from "@/lib/format";

export function SincronizacionPanel({ ultimaSincronizacion }: { ultimaSincronizacion: string | null }) {
  const router = useRouter();
  const [testeando, startTest] = useTransition();
  const [sincronizando, startSync] = useTransition();
  const [estadoConexion, setEstadoConexion] = useState<{ ok: boolean; error?: string; latenciaMs?: number } | null>(null);
  const [resultado, setResultado] = useState<ResultadoSincronizacion | null>(null);

  function probar() {
    startTest(async () => {
      const r = await probarConexion();
      setEstadoConexion(r);
      if (r.ok) toast.success(`Conexión OK (${r.latenciaMs} ms)`);
      else toast.error(`Error de conexión: ${r.error}`);
    });
  }

  function sincronizar() {
    startSync(async () => {
      try {
        const r = await sincronizarAum();
        setResultado(r);
        toast.success(`Sincronizado: ${r.clientesActualizados} clientes actualizados.`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo sincronizar.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Conexión a Supabase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" size="sm" onClick={probar} disabled={testeando}>
            <Wifi className="h-4 w-4" /> Probar conexión
          </Button>
          {estadoConexion && (
            <div>
              {estadoConexion.ok ? (
                <span className="chip" style={{ color: "var(--green)", background: "var(--green-tint)" }}>
                  Conectado ({estadoConexion.latenciaMs} ms)
                </span>
              ) : (
                <span className="chip" style={{ color: "var(--neg-soft)", background: "rgba(216,71,63,.16)" }}>
                  Error: {estadoConexion.error}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sincronizar AUM</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Última sincronización exitosa:{" "}
            <span className="text-foreground font-medium">
              {ultimaSincronizacion ? new Date(ultimaSincronizacion).toLocaleString("es-AR") : "nunca"}
            </span>
          </p>
          <Button onClick={sincronizar} disabled={sincronizando}>
            <RefreshCw className={sincronizando ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            {sincronizando ? "Sincronizando..." : "Sincronizar AUM"}
          </Button>

          {resultado && (
            <div className="mt-4 space-y-1 rounded-md border p-4 text-sm">
              <p>
                Fecha: <strong>{formatFecha(resultado.fecha)}</strong>
              </p>
              <p>
                MEP usado: <strong>{formatUSD(resultado.mepArsUsd).replace("US$", "$")} ARS/USD</strong> ({resultado.mepTicker})
              </p>
              <p>
                Clientes actualizados: <strong>{resultado.clientesActualizados}</strong>
              </p>
              <p>
                Clientes sin cuenta vinculada: <strong>{resultado.clientesSinVincular}</strong>
              </p>
              <p>
                Cambios de segmento: <strong>{resultado.segmentosCambiados}</strong>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
