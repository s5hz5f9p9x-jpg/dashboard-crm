"use client";

import { useTransition } from "react";
import Link from "next/link";
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
import { formatFecha } from "@/lib/format";
import { actualizarPedidoReferido, type PedidoReferidoConCliente } from "@/app/actions/referidos";
import type { DioNombre, ResultadoReferido } from "@/lib/db/schema";

const DIO_NOMBRE_LABEL: Record<DioNombre, string> = { si: "Sí", no: "No", pendiente: "Pendiente" };
const RESULTADO_LABEL: Record<ResultadoReferido, string> = {
  sin_contacto: "Sin contacto",
  contactado: "Contactado",
  llamada_agendada: "Llamada agendada",
  diagnostico_enviado: "Diagnóstico enviado",
  cliente: "Cliente",
  no_avanzo: "No avanzó",
};

export function PedidosReferidoList({ pedidos }: { pedidos: PedidoReferidoConCliente[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function actualizar(id: string, patch: { dioNombre?: DioNombre; resultado?: ResultadoReferido }) {
    startTransition(async () => {
      await actualizarPedidoReferido(id, patch);
      router.refresh();
    });
  }

  if (pedidos.length === 0) {
    return <p className="text-muted-foreground text-sm">Todavía no registraste ningún pedido de referido.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Canal</TableHead>
            <TableHead>¿Dio nombre?</TableHead>
            <TableHead>Resultado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pedidos.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <Link href={`/clientes/${p.cliente.id}`} className="hover:underline">
                  {p.cliente.apellido}, {p.cliente.nombre}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">{formatFecha(p.fecha)}</TableCell>
              <TableCell className="text-muted-foreground text-sm capitalize">{p.canal}</TableCell>
              <TableCell>
                <Select value={p.dioNombre} onValueChange={(v) => actualizar(p.id, { dioNombre: v as DioNombre })}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(DIO_NOMBRE_LABEL) as DioNombre[]).map((v) => (
                      <SelectItem key={v} value={v}>
                        {DIO_NOMBRE_LABEL[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select value={p.resultado} onValueChange={(v) => actualizar(p.id, { resultado: v as ResultadoReferido })}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(RESULTADO_LABEL) as ResultadoReferido[]).map((v) => (
                      <SelectItem key={v} value={v}>
                        {RESULTADO_LABEL[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
