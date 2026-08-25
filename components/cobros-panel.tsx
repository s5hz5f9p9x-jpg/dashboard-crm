"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, MessageCircle, AlertTriangle, PhoneOff } from "lucide-react";
import { formatUSD } from "@/lib/format";
import { linkWhatsApp } from "@/lib/telefono";
import type { ResultadoCobros, ClienteConCobros } from "@/app/actions/cobros";

function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

function diaMes(fecha: string): string {
  const [, m, d] = fecha.split("-");
  return `${d}/${m}`;
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function rangoLegible(desde: string, hasta: string): string {
  const [, md, dd] = desde.split("-");
  const [, mh, dh] = hasta.split("-");
  const inicio = `${Number(dd)} ${MESES[Number(md) - 1]}`;
  const fin = `${Number(dh)} ${MESES[Number(mh) - 1]}`;
  return `${inicio} — ${fin}`;
}

/**
 * Mensaje sugerido, siempre editable antes de enviar.
 *
 * El saludo va sin nombre a propósito: muchos registros vienen del Excel con el
 * apellido compuesto partido al medio (p. ej. "Pereyra Iraola, Diego" quedó como
 * apellido "PEREYRA" y nombre "IRAOLA DIEGO"), así que tomar la primera palabra
 * del nombre saludaría "Hola IRAOLA". No hay forma confiable de deducirlo, así
 * que se deja que la persona lo complete.
 */
function mensajeSugerido(c: ClienteConCobros): string {
  const items = c.detalles
    .map((d) => `• ${d.ticker}: ${formatUSD(d.totalUsd)} el ${diaMes(d.fecha)}`)
    .join("\n");
  const total = c.detalles.length > 1 ? `\n\nTotal: ${formatUSD(c.totalUsd)}` : "";
  return `Hola, te aviso que esta semana tenés un cobro acreditado:\n\n${items}${total}\n\nCualquier duda quedo a disposición.`;
}

export function CobrosPanel({ datos }: { datos: ResultadoCobros }) {
  const [minimo, setMinimo] = useState(0);

  const visibles = useMemo(
    () => datos.clientes.filter((c) => c.totalUsd >= minimo),
    [datos.clientes, minimo],
  );
  const totalVisible = visibles.reduce((acc, c) => acc + c.totalUsd, 0);
  const sinTelVisible = visibles.filter((c) => !c.telefonoE164).length;

  const semanaAnterior = sumarDias(datos.desde, -7);
  const semanaSiguiente = sumarDias(datos.desde, 7);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/cobros?semana=${semanaAnterior}`} aria-label="Semana anterior">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="num text-sm font-semibold">{rangoLegible(datos.desde, datos.hasta)}</span>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/cobros?semana=${semanaSiguiente}`} aria-label="Semana siguiente">
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/cobros">Esta semana</Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Kpi label="A cobrar" valor={formatUSD(totalVisible)} color="var(--green)" />
        <Kpi label="Clientes" valor={String(visibles.length)} />
        <Kpi
          label="Sin teléfono"
          valor={String(sinTelVisible)}
          color={sinTelVisible ? "var(--warn)" : undefined}
        />
      </div>

      {datos.tickersSinCronograma.length > 0 && (
        <div
          className="flex gap-3 rounded-[14px] border px-4 py-3 text-sm"
          style={{ background: "rgba(224,160,42,.10)", borderColor: "rgba(224,160,42,.25)" }}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--warn)" }} />
          <div>
            <p>
              <strong className="num">{datos.tickersSinCronograma.length}</strong> instrumentos de renta fija en
              cartera no tienen cronograma cargado. Un cliente que solo tenga estos va a figurar sin cobros aunque
              sí cobre.
            </p>
            <p className="num mt-1 text-xs" style={{ color: "var(--text-3)" }}>
              {datos.tickersSinCronograma.join(" · ")}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-4)" }}>
              Se cargan desde la pantalla de Carga del dashboard.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="label">Monto mínimo</span>
        <Input
          type="number"
          min={0}
          value={minimo}
          onChange={(e) => setMinimo(Math.max(0, Number(e.target.value) || 0))}
          className="num w-28"
        />
        <span className="text-xs" style={{ color: "var(--text-4)" }}>
          para no avisar por montos chicos
        </span>
      </div>

      {visibles.length === 0 ? (
        <div className="card py-10 text-center text-sm" style={{ color: "var(--text-4)" }}>
          {datos.clientes.length === 0
            ? "Ningún cliente cobra en esta semana."
            : `Ningún cobro llega al mínimo de ${formatUSD(minimo)}.`}
        </div>
      ) : (
        <div className="space-y-2">
          {visibles.map((c) => (
            <FilaCobro key={c.clienteId} cliente={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function Kpi({ label, valor, color }: { label: string; valor: string; color?: string }) {
  return (
    <div className="card px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="label text-[10px] sm:text-[11px]">{label}</div>
      <div className="num mt-1.5 truncate text-base font-semibold sm:text-xl" style={{ color: color ?? "var(--text)" }}>
        {valor}
      </div>
    </div>
  );
}

function FilaCobro({ cliente: c }: { cliente: ClienteConCobros }) {
  const [mensaje, setMensaje] = useState(() => mensajeSugerido(c));
  const [editando, setEditando] = useState(false);

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link href={`/clientes/${c.clienteId}`} className="font-semibold hover:underline">
            {c.apellido}, {c.nombre}
          </Link>
          {c.estado !== "activo" && (
            <span className="chip ml-2 capitalize" style={{ background: "rgba(243,243,233,.07)", color: "var(--text-4)" }}>
              {c.estado}
            </span>
          )}
          <ul className="mt-2 space-y-0.5">
            {c.detalles.map((d, i) => (
              <li key={i} className="num text-xs" style={{ color: "var(--text-3)" }}>
                {diaMes(d.fecha)} · {d.ticker} · VN {Math.round(d.nominales).toLocaleString("es-AR")} ·{" "}
                {d.amortUsd > 0 ? `renta ${formatUSD(d.rentaUsd)} + amort ${formatUSD(d.amortUsd)}` : `renta ${formatUSD(d.rentaUsd)}`}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="num text-lg font-semibold" style={{ color: "var(--green)" }}>
            {formatUSD(c.totalUsd)}
          </span>
          {c.telefonoE164 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditando((v) => !v)}
                className="text-xs hover:underline"
                style={{ color: "var(--text-4)" }}
              >
                {editando ? "Ocultar" : "Ver mensaje"}
              </button>
              <Button size="sm" className="btn-pill h-8" asChild>
                <a href={linkWhatsApp(c.telefonoE164, mensaje)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
              </Button>
            </div>
          ) : (
            <span
              className="chip"
              style={{ background: "rgba(224,160,42,.14)", color: "var(--warn)" }}
              title={c.motivoTelefono ?? undefined}
            >
              <PhoneOff className="h-3 w-3" /> Sin teléfono
            </span>
          )}
        </div>
      </div>

      {editando && c.telefonoE164 && (
        <div className="mt-3">
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={6}
            className="w-full rounded-md border p-2 text-sm outline-none"
            style={{ background: "var(--surface-2)", borderColor: "var(--border-token)", color: "var(--text)" }}
          />
          <p className="mt-1 text-xs" style={{ color: "var(--text-4)" }}>
            Completá el nombre en el saludo si querés. Los apellidos compuestos vienen partidos del Excel, así que el
            saludo va sin nombre para no equivocarlo.
          </p>
        </div>
      )}
    </div>
  );
}
