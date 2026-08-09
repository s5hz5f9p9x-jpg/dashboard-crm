"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  confirmarVinculo,
  ignorarCuentaSupabase,
  quitarVinculo,
  reactivarCuentaIgnorada,
  type EstadoVinculacion,
} from "@/app/actions/vinculacion";

const CONFIANZA_ESTILO: Record<string, { color: string; background: string }> = {
  fuerte: { color: "var(--green)", background: "var(--green-tint)" },
  media: { color: "var(--warn)", background: "rgba(224,160,42,.18)" },
  sin_sugerencia: { color: "var(--text-3)", background: "rgba(243,243,233,.08)" },
};

const CONFIANZA_LABEL: Record<string, string> = {
  fuerte: "Sugerencia fuerte",
  media: "Sugerencia por nombre",
  sin_sugerencia: "Sin sugerencia",
};

export function VinculacionPanel({ estado }: { estado: EstadoVinculacion }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogFor, setDialogFor] = useState<CuentaLocal | null>(null);

  type CuentaLocal = EstadoVinculacion["sinVincular"][number];

  function vincular(cuenta: CuentaLocal, clienteId: string) {
    startTransition(async () => {
      await confirmarVinculo({
        clienteId,
        broker: cuenta.broker,
        accountCode: cuenta.accountCode,
        supabaseAccountId: cuenta.supabaseAccountId,
      });
      toast.success(`Vinculado: ${cuenta.rawName}`);
      setDialogFor(null);
      router.refresh();
    });
  }

  function desvincular(id: string) {
    startTransition(async () => {
      await quitarVinculo(id);
      toast.success("Vínculo eliminado.");
      router.refresh();
    });
  }

  function ignorar(cuenta: CuentaLocal) {
    startTransition(async () => {
      await ignorarCuentaSupabase({ broker: cuenta.broker, accountCode: cuenta.accountCode, motivo: "Ya no es cliente" });
      toast.success(`Ignorada: ${cuenta.rawName}. No se va a volver a mostrar.`);
      router.refresh();
    });
  }

  function reactivar(id: string) {
    startTransition(async () => {
      await reactivarCuentaIgnorada(id);
      toast.success("Cuenta reactivada, vuelve a aparecer en sin vincular.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <Badge variant="secondary">{estado.vinculadas.length} vinculadas</Badge>
        <Badge variant="outline">{estado.sinVincular.length} sin vincular</Badge>
        {estado.ignoradas.length > 0 && <Badge variant="outline">{estado.ignoradas.length} ignoradas</Badge>}
      </div>

      {estado.sinVincular.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cuenta en Supabase</TableHead>
                <TableHead>Sugerencia</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estado.sinVincular.map((c) => (
                <TableRow key={c.supabaseAccountId}>
                  <TableCell>
                    <div className="font-medium">{c.rawName}</div>
                    <div className="text-muted-foreground text-xs">
                      {c.broker} · cuenta {c.accountCode}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="chip" style={CONFIANZA_ESTILO[c.sugerencia.confianza]}>
                      {CONFIANZA_LABEL[c.sugerencia.confianza]}
                    </span>
                    {c.sugerencia.clienteNombre && (
                      <div className="text-muted-foreground mt-1 text-xs">{c.sugerencia.clienteNombre}</div>
                    )}
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    {c.sugerencia.clienteId && (
                      <Button size="sm" disabled={pending} onClick={() => vincular(c, c.sugerencia.clienteId!)}>
                        Confirmar
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setDialogFor(c)}>
                      {c.sugerencia.clienteId ? "Elegir otro" : "Elegir cliente"}
                    </Button>
                    <Button size="sm" variant="ghost" disabled={pending} onClick={() => ignorar(c)}>
                      Ya no es cliente
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {estado.sinVincular.length === 0 && (
        <p className="text-muted-foreground text-sm">No quedan cuentas de Supabase sin vincular.</p>
      )}

      {estado.ignoradas.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-medium">Ignoradas</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuenta en Supabase</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estado.ignoradas.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <div className="font-medium">{i.rawName}</div>
                      <div className="text-muted-foreground text-xs">
                        {i.broker} · cuenta {i.accountCode}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{i.motivo}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" disabled={pending} onClick={() => reactivar(i.id)}>
                        Reactivar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {estado.vinculadas.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-medium">Vinculadas</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estado.vinculadas.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>{v.clienteNombre}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {v.broker} · {v.accountCode}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" disabled={pending} onClick={() => desvincular(v.id)}>
                        Quitar vínculo
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <BuscarClienteDialog
        cuenta={dialogFor}
        clientes={estado.clientesDisponibles}
        onClose={() => setDialogFor(null)}
        onElegir={(clienteId) => dialogFor && vincular(dialogFor, clienteId)}
      />
    </div>
  );
}

function BuscarClienteDialog({
  cuenta,
  clientes,
  onClose,
  onElegir,
}: {
  cuenta: { rawName: string } | null;
  clientes: { id: string; nombre: string; apellido: string }[];
  onClose: () => void;
  onElegir: (clienteId: string) => void;
}) {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return clientes.slice(0, 30);
    return clientes
      .filter((c) => `${c.apellido} ${c.nombre}`.toLowerCase().includes(q))
      .slice(0, 30);
  }, [busqueda, clientes]);

  return (
    <Dialog open={!!cuenta} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Elegir cliente para &quot;{cuenta?.rawName}&quot;</DialogTitle>
        </DialogHeader>
        <Input placeholder="Buscar por nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        <div className="max-h-72 overflow-y-auto">
          {filtrados.map((c) => (
            <button
              key={c.id}
              className="hover:bg-muted flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm"
              onClick={() => onElegir(c.id)}
            >
              {c.apellido}, {c.nombre}
            </button>
          ))}
          {filtrados.length === 0 && <p className="text-muted-foreground p-2 text-sm">Sin resultados.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
