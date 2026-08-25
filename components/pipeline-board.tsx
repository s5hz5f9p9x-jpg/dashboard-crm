"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { ETAPAS_PIPELINE } from "@/lib/prospectos";
import { moverEtapaProspecto, convertirEnCliente } from "@/app/actions/prospectos";
import type { EtapaProspecto } from "@/lib/db/schema";
import { formatPct, dividirSeguro } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ProspectoPipeline {
  id: string;
  nombre: string;
  etapa: EtapaProspecto;
  origen: string;
  patrimonio_declarado: string | null;
  calificado: boolean;
  cliente_id: string | null;
  /** Calculado en el server para que no haya desajuste de fechas al hidratar. */
  diasEnPipeline: number;
}

/** A partir de acá un prospecto abierto se marca como estancado. */
const DIAS_ALERTA = 14;

const ETAPAS_ABIERTAS = ETAPAS_PIPELINE.filter((e) => e.etapa !== "ganado" && e.etapa !== "perdido");

const ETAPA_COLOR: Record<EtapaProspecto, string> = {
  lead: "var(--text-4)",
  calificado: "var(--navy)",
  diagnostico_enviado: "var(--navy)",
  llamada_agendada: "var(--warn)",
  llamada_realizada: "var(--warn)",
  propuesta: "var(--green-mid)",
  ganado: "var(--green)",
  perdido: "var(--neg-soft)",
};

const ORIGEN_LABEL: Record<string, string> = {
  referido: "Referido",
  linkedin_organico: "LinkedIn",
  instagram_organico: "Instagram",
  publicidad_instagram: "Ads IG",
  publicidad_linkedin: "Ads LinkedIn",
  newsletter: "Newsletter",
  landing_directo: "Landing",
  otro: "Otro",
};

const PATRIMONIO_LABEL: Record<string, string> = {
  menos_20k: "< 20k",
  "20k_50k": "20–50k",
  "50k_150k": "50–150k",
  mas_150k: "> 150k",
};

export function PipelineBoard({ prospectos }: { prospectos: ProspectoPipeline[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobreEtapa, setSobreEtapa] = useState<EtapaProspecto | null>(null);

  function mover(prospectoId: string, nuevaEtapa: EtapaProspecto) {
    startTransition(async () => {
      await moverEtapaProspecto(prospectoId, nuevaEtapa);
      router.refresh();
    });
  }

  function convertir(prospectoId: string) {
    startTransition(async () => {
      const clienteId = await convertirEnCliente(prospectoId);
      toast.success("Convertido en cliente.");
      router.push(`/clientes/${clienteId}`);
    });
  }

  function handleDrop(etapa: EtapaProspecto) {
    setSobreEtapa(null);
    if (!arrastrando) return;
    const prospecto = prospectos.find((p) => p.id === arrastrando);
    setArrastrando(null);
    if (!prospecto || prospecto.etapa === etapa) return;
    mover(prospecto.id, etapa);
  }

  const porEtapa = (etapa: EtapaProspecto) => prospectos.filter((p) => p.etapa === etapa);

  const ganados = porEtapa("ganado");
  const perdidos = porEtapa("perdido");
  const abiertos = prospectos.filter((p) => p.etapa !== "ganado" && p.etapa !== "perdido");
  const estancados = abiertos.filter((p) => p.diasEnPipeline >= DIAS_ALERTA);
  const tasaCierre = dividirSeguro(ganados.length, ganados.length + perdidos.length);

  // El ancho de cada barra es relativo a la etapa más cargada, para que el embudo
  // se lea de un vistazo aunque los números sean chicos.
  const maxAbiertos = Math.max(1, ...ETAPAS_ABIERTAS.map((e) => porEtapa(e.etapa).length));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="En curso" valor={abiertos.length} color="var(--text)" />
        <Kpi label="Ganados" valor={ganados.length} color="var(--green)" />
        <Kpi label="Perdidos" valor={perdidos.length} color="var(--neg-soft)" />
        <Kpi
          label="Tasa de cierre"
          valor={formatPct(tasaCierre, 0)}
          color={tasaCierre !== null && tasaCierre >= 0.5 ? "var(--green)" : "var(--text)"}
        />
      </div>

      {estancados.length > 0 && (
        <div
          className="flex items-center gap-2 rounded-[14px] border px-4 py-3 text-sm"
          style={{ background: "rgba(224,160,42,.10)", borderColor: "rgba(224,160,42,.25)" }}
        >
          <span className="chip-dot" style={{ background: "var(--warn)" }} />
          <span>
            <strong className="num">{estancados.length}</strong>{" "}
            {estancados.length === 1 ? "prospecto lleva" : "prospectos llevan"} más de {DIAS_ALERTA} días sin avanzar
            de etapa.
          </span>
        </div>
      )}

      <div className="card space-y-1 p-3 sm:p-4">
        {ETAPAS_ABIERTAS.map(({ etapa, etiqueta }) => {
          const items = porEtapa(etapa);
          const color = ETAPA_COLOR[etapa];
          const vacia = items.length === 0;

          return (
            <div
              key={etapa}
              onDragOver={(e) => {
                e.preventDefault();
                setSobreEtapa(etapa);
              }}
              onDragLeave={() => setSobreEtapa((s) => (s === etapa ? null : s))}
              onDrop={() => handleDrop(etapa)}
              className={cn(
                "grid items-start gap-x-5 gap-y-3 rounded-[14px] px-3 py-3 transition-colors sm:grid-cols-[190px_1fr]",
                sobreEtapa === etapa && "ring-1",
              )}
              style={sobreEtapa === etapa ? { background: "var(--green-tint)", boxShadow: `inset 0 0 0 1px var(--green)` } : undefined}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="chip-dot" style={{ background: color, opacity: vacia ? 0.35 : 1 }} />
                  <span className="label" style={{ color: vacia ? "var(--text-4)" : "var(--text-2)" }}>
                    {etiqueta}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-3">
                  <span className="kpi" style={{ color: vacia ? "var(--text-4)" : "var(--text)" }}>
                    {items.length}
                  </span>
                  <span className="minibar mt-0.5 flex-1">
                    <span
                      style={{
                        width: `${(items.length / maxAbiertos) * 100}%`,
                        background: color,
                        opacity: vacia ? 0 : 1,
                      }}
                    />
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {items.map((p) => (
                  <ProspectoCard
                    key={p.id}
                    prospecto={p}
                    arrastrando={arrastrando === p.id}
                    onDragStart={() => setArrastrando(p.id)}
                    onDragEnd={() => setArrastrando(null)}
                    onMover={mover}
                  />
                ))}
                {vacia && (
                  <span className="self-center text-xs" style={{ color: "var(--text-4)" }}>
                    Sin prospectos en esta etapa
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CierreCard
          etapa="ganado"
          etiqueta="Ganados"
          items={ganados}
          sobreEtapa={sobreEtapa}
          setSobreEtapa={setSobreEtapa}
          onDrop={handleDrop}
          arrastrando={arrastrando}
          setArrastrando={setArrastrando}
          onMover={mover}
          onConvertir={convertir}
          pending={pending}
        />
        <CierreCard
          etapa="perdido"
          etiqueta="Perdidos"
          items={perdidos}
          sobreEtapa={sobreEtapa}
          setSobreEtapa={setSobreEtapa}
          onDrop={handleDrop}
          arrastrando={arrastrando}
          setArrastrando={setArrastrando}
          onMover={mover}
          onConvertir={convertir}
          pending={pending}
        />
      </div>
    </div>
  );
}

function Kpi({ label, valor, color }: { label: string; valor: string | number; color: string }) {
  return (
    <div className="card px-4 py-3">
      <div className="label">{label}</div>
      <div className="kpi mt-1.5" style={{ color }}>
        {valor}
      </div>
    </div>
  );
}

function ProspectoCard({
  prospecto: p,
  arrastrando,
  onDragStart,
  onDragEnd,
  onMover,
  children,
}: {
  prospecto: ProspectoPipeline;
  arrastrando: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMover: (id: string, etapa: EtapaProspecto) => void;
  children?: React.ReactNode;
}) {
  const estancado = p.diasEnPipeline >= DIAS_ALERTA && p.etapa !== "ganado" && p.etapa !== "perdido";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group w-[210px] cursor-grab rounded-[14px] border px-3 py-2.5 transition-opacity active:cursor-grabbing",
        arrastrando && "opacity-40",
      )}
      style={{ background: "var(--surface-2)", borderColor: "var(--border-token)" }}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold" title={p.nombre}>
          {p.nombre}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="-mt-1 -mr-1.5 h-6 w-6 shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {ETAPAS_PIPELINE.filter((e) => e.etapa !== p.etapa).map((e) => (
              <DropdownMenuItem key={e.etapa} onSelect={() => onMover(p.id, e.etapa)}>
                Mover a: {e.etiqueta}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {p.patrimonio_declarado && (
          <span
            className="chip num"
            style={
              p.calificado
                ? { background: "var(--green-tint)", color: "var(--green)" }
                : { background: "rgba(243,243,233,.07)", color: "var(--text-4)" }
            }
            title={p.calificado ? "Patrimonio calificado" : "Patrimonio por debajo del mínimo"}
          >
            {PATRIMONIO_LABEL[p.patrimonio_declarado] ?? p.patrimonio_declarado}
          </span>
        )}
        <span className="text-[11px]" style={{ color: "var(--text-4)" }}>
          {ORIGEN_LABEL[p.origen] ?? p.origen}
        </span>
        {estancado && (
          <span className="num text-[11px]" style={{ color: "var(--warn)" }} title="Días en el pipeline">
            {p.diasEnPipeline}d
          </span>
        )}
      </div>

      {children}
    </div>
  );
}

function CierreCard({
  etapa,
  etiqueta,
  items,
  sobreEtapa,
  setSobreEtapa,
  onDrop,
  arrastrando,
  setArrastrando,
  onMover,
  onConvertir,
  pending,
}: {
  etapa: EtapaProspecto;
  etiqueta: string;
  items: ProspectoPipeline[];
  sobreEtapa: EtapaProspecto | null;
  setSobreEtapa: (fn: EtapaProspecto | null | ((s: EtapaProspecto | null) => EtapaProspecto | null)) => void;
  onDrop: (etapa: EtapaProspecto) => void;
  arrastrando: string | null;
  setArrastrando: (id: string | null) => void;
  onMover: (id: string, etapa: EtapaProspecto) => void;
  onConvertir: (id: string) => void;
  pending: boolean;
}) {
  const color = ETAPA_COLOR[etapa];
  const activo = sobreEtapa === etapa;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setSobreEtapa(etapa);
      }}
      onDragLeave={() => setSobreEtapa((s) => (s === etapa ? null : s))}
      onDrop={() => onDrop(etapa)}
      className="card space-y-3"
      style={activo ? { boxShadow: `inset 0 0 0 1px ${color}` } : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="chip-dot" style={{ background: color }} />
          <span className="label" style={{ color: "var(--text-2)" }}>
            {etiqueta}
          </span>
        </div>
        <span className="kpi" style={{ color: items.length ? color : "var(--text-4)" }}>
          {items.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((p) => (
          <ProspectoCard
            key={p.id}
            prospecto={p}
            arrastrando={arrastrando === p.id}
            onDragStart={() => setArrastrando(p.id)}
            onDragEnd={() => setArrastrando(null)}
            onMover={onMover}
          >
            {etapa === "ganado" && !p.cliente_id && (
              <Button
                size="sm"
                className="btn-pill mt-2 h-7 w-full text-xs"
                disabled={pending}
                onClick={() => onConvertir(p.id)}
              >
                Convertir en cliente
              </Button>
            )}
            {p.cliente_id && (
              <Link
                href={`/clientes/${p.cliente_id}`}
                className="mt-2 block text-[11px] font-semibold hover:underline"
                style={{ color: "var(--green)" }}
              >
                Ver cliente →
              </Link>
            )}
          </ProspectoCard>
        ))}
        {items.length === 0 && (
          <span className="text-xs" style={{ color: "var(--text-4)" }}>
            Todavía no hay.
          </span>
        )}
      </div>
    </div>
  );
}
