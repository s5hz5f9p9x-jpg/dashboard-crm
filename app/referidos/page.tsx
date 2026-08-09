import { listarPedidosReferido, obtenerMejoresReferidores, obtenerMetricasReferidos } from "@/app/actions/referidos";
import { db } from "@/lib/db/client";
import { clientes } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PedidosReferidoList } from "@/components/pedidos-referido-list";
import { NuevoPedidoReferidoDialog } from "@/components/nuevo-pedido-referido-dialog";
import { formatPct } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ReferidosPage() {
  const [pedidos, metricas, mejores, todosClientes] = await Promise.all([
    listarPedidosReferido(),
    obtenerMetricasReferidos(),
    obtenerMejoresReferidores(),
    db.select({ id: clientes.id, nombre: clientes.nombre, apellido: clientes.apellido }).from(clientes),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Referidos</h1>
          <p className="text-muted-foreground text-sm">El canal de mejor conversión del negocio.</p>
        </div>
        <NuevoPedidoReferidoDialog clientes={todosClientes} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricaCard label="Pedidos realizados" valor={metricas.pedidos} />
        <MetricaCard label="Nombres obtenidos" valor={metricas.nombresObtenidos} />
        <MetricaCard label="Tasa de conversión" valor={formatPct(metricas.tasaConversionPedido)} />
        <MetricaCard label="Clientes cerrados" valor={metricas.clientesCerrados} />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <h2 className="mb-3 text-lg font-medium">Pedidos</h2>
          <PedidosReferidoList pedidos={pedidos} />
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Mejores referidores</CardTitle>
            </CardHeader>
            <CardContent>
              {mejores.length === 0 ? (
                <p className="text-muted-foreground text-sm">Todavía no hay referidos registrados.</p>
              ) : (
                <ol className="space-y-2">
                  {mejores.map((m, i) => (
                    <li key={m.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground w-5">{i + 1}.</span>
                      <Link href={`/clientes/${m.id}`} className="flex-1 hover:underline">
                        {m.apellido}, {m.nombre}
                      </Link>
                      <span className="font-medium">{m.cantidadReferidos}</span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricaCard({ label, valor }: { label: string; valor: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-normal">{label}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold">{valor}</CardContent>
    </Card>
  );
}
