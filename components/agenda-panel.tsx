"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, Mail, Check, Flame, ArrowRight } from "lucide-react";
import { formatUSD } from "@/lib/format";
import { segmentoEfectivo, type ClienteParaAgenda } from "@/lib/metas";
import type { ResumenAgenda } from "@/app/actions/agenda";
import { registrarContactoRapido } from "@/app/actions/agenda";
import type { TipoContacto } from "@/lib/db/schema";

const COLOR_SEGMENTO: Record<string, string> = {
  A: "var(--green)",
  B: "var(--warn)",
  C: "var(--text-3)",
};

export function AgendaPanel({ datos }: { datos: ResumenAgenda }) {
  const pct = datos.metaMensual > 0 ? Math.min(1, datos.hechosEsteMes / datos.metaMensual) : 0;
  const faltan = Math.max(0, datos.metaMensual - datos.hechosEsteMes);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <div className="card flex items-center gap-5 px-6 py-5">
          <Anillo porcentaje={pct} />
          <div>
            <div className="label">Contactos del mes</div>
            <div className="num text-2xl font-semibold">
              {datos.hechosEsteMes}
              <span style={{ color: "var(--text-4)" }}> / {datos.metaMensual}</span>
            </div>
            <div className="mt-1 text-xs" style={{ color: "var(--text-3)" }}>
              {faltan === 0 ? "Meta cumplida 🎉" : `Faltan ${faltan}`}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card px-4 py-3">
            <div className="label">Esta semana</div>
            <div className="num mt-1.5 text-xl font-semibold">
              {datos.hechosEstaSemana}
              <span style={{ color: "var(--text-4)" }}> / {datos.objetivoSemanal}</span>
            </div>
          </div>
          <div className="card px-4 py-3">
            <div className="label">Racha</div>
            <div className="num mt-1.5 flex items-center gap-1.5 text-xl font-semibold">
              {datos.racha > 0 && <Flame className="h-4 w-4" style={{ color: "var(--warn)" }} />}
              {datos.racha}
              <span className="text-sm font-normal" style={{ color: "var(--text-4)" }}>
                {datos.racha === 1 ? "semana" : "semanas"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-black">Tu lista de hoy</h2>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>
              Los cinco más urgentes de {datos.atrasados} atrasados. Un clic registra el contacto.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/clientes">
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {datos.agenda.length === 0 ? (
          <div className="card py-10 text-center text-sm" style={{ color: "var(--text-4)" }}>
            No queda nadie por contactar hoy. Buen trabajo.
          </div>
        ) : (
          <div className="space-y-2">
            {datos.agenda.map((c) => (
              <FilaAgenda key={c.id} cliente={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Anillo({ porcentaje }: { porcentaje: number }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" className="shrink-0 -rotate-90">
      <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(243,243,233,.10)" strokeWidth="8" />
      <circle
        cx="42"
        cy="42"
        r={r}
        fill="none"
        stroke="var(--green)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - porcentaje)}
        style={{ transition: "stroke-dashoffset 600ms var(--ease-out)" }}
      />
      <text
        x="42"
        y="42"
        textAnchor="middle"
        dominantBaseline="central"
        className="num"
        transform="rotate(90 42 42)"
        fill="var(--text)"
        fontSize="17"
        fontWeight="600"
      >
        {Math.round(porcentaje * 100)}%
      </text>
    </svg>
  );
}

function FilaAgenda({ cliente: c }: { cliente: ClienteParaAgenda }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [hecho, setHecho] = useState(false);
  const seg = segmentoEfectivo(c);

  function registrar(tipo: TipoContacto) {
    startTransition(async () => {
      await registrarContactoRapido(c.id, tipo);
      setHecho(true);
      toast.success(`Contacto registrado con ${c.nombre}.`);
      router.refresh();
    });
  }

  if (hecho) {
    return (
      <div
        className="card flex items-center gap-3 px-4 py-3"
        style={{ background: "var(--green-tint)", borderColor: "var(--green)" }}
      >
        <Check className="h-4 w-4" style={{ color: "var(--green)" }} />
        <span className="text-sm font-semibold">
          {c.apellido}, {c.nombre}
        </span>
        <span className="text-xs" style={{ color: "var(--text-3)" }}>
          registrado
        </span>
      </div>
    );
  }

  return (
    <div className="card flex flex-wrap items-center gap-3 px-4 py-3">
      <span
        className="chip shrink-0 font-bold"
        style={{ color: COLOR_SEGMENTO[seg], background: "rgba(243,243,233,.06)" }}
      >
        {seg}
      </span>

      <div className="min-w-0 flex-1">
        <Link href={`/clientes/${c.id}`} className="truncate font-semibold hover:underline">
          {c.apellido}, {c.nombre}
        </Link>
        <div className="num text-[11px]" style={{ color: "var(--text-4)" }}>
          {c.tuvoContacto ? `hace ${c.diasDesdeUltimoContacto} días` : "sin contacto registrado"}
          {c.aum_actual_usd > 0 && ` · ${formatUSD(c.aum_actual_usd)}`}
        </div>
      </div>

      <div className="flex shrink-0 gap-1.5">
        <BotonRapido onClick={() => registrar("whatsapp")} disabled={pending} titulo="Registrar WhatsApp">
          <MessageCircle className="h-3.5 w-3.5" />
        </BotonRapido>
        <BotonRapido onClick={() => registrar("llamada")} disabled={pending} titulo="Registrar llamada">
          <Phone className="h-3.5 w-3.5" />
        </BotonRapido>
        <BotonRapido onClick={() => registrar("email")} disabled={pending} titulo="Registrar email">
          <Mail className="h-3.5 w-3.5" />
        </BotonRapido>
      </div>
    </div>
  );
}

function BotonRapido({
  onClick,
  disabled,
  titulo,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={titulo}
      aria-label={titulo}
      className="btn-pill flex h-8 w-8 items-center justify-center border transition-colors disabled:opacity-40"
      style={{ borderColor: "var(--border-token)", color: "var(--text-3)" }}
    >
      {children}
    </button>
  );
}
