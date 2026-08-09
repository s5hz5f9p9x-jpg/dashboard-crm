import { LayoutDashboard, Users, ArrowUpRight, ArrowRight } from "lucide-react";

const DASHBOARD_URL = "https://dashboard-tenencias-drivercapital44.vercel.app/";

export default function HubPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-[14px]"
          style={{ background: "var(--green)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/driver-iso-black.svg" alt="Driver Capital" width={26} height={26} />
        </div>
        <h1 className="text-[28px] font-black" style={{ letterSpacing: "-0.02em" }}>
          Driver Capital
        </h1>
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          Elegí a dónde querés ir.
        </p>
      </div>

      <div className="grid w-full max-w-3xl gap-5 sm:grid-cols-2">
        <a
          href={DASHBOARD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="card-hero group flex flex-col gap-4 transition-transform"
          style={{ transitionDuration: "var(--dur)", transitionTimingFunction: "var(--ease-out)" }}
        >
          <div className="flex items-start justify-between">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-[14px]"
              style={{ background: "var(--green-tint)", color: "var(--green)" }}
            >
              <LayoutDashboard size={22} strokeWidth={2} />
            </div>
            <ArrowUpRight
              size={18}
              className="opacity-0 transition-opacity group-hover:opacity-100"
              style={{ color: "var(--green)" }}
            />
          </div>
          <div>
            <h2 className="text-lg font-black" style={{ letterSpacing: "-0.01em" }}>
              Dashboard de Tenencias
            </h2>
            <p className="mt-1 text-[13px]" style={{ color: "var(--text-3)" }}>
              Cartera consolidada IEB + Balanz, valuada en vivo en USD MEP. Se abre en la nube, desde cualquier
              dispositivo.
            </p>
          </div>
          <span className="label-accent mt-auto">Abrir en la nube</span>
        </a>

        <a
          href="/inicio"
          className="card-hero group flex flex-col gap-4 transition-transform"
          style={{ transitionDuration: "var(--dur)", transitionTimingFunction: "var(--ease-out)" }}
        >
          <div className="flex items-start justify-between">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-[14px]"
              style={{ background: "var(--green-tint)", color: "var(--green)" }}
            >
              <Users size={22} strokeWidth={2} />
            </div>
            <ArrowRight
              size={18}
              className="opacity-0 transition-opacity group-hover:opacity-100"
              style={{ color: "var(--green)" }}
            />
          </div>
          <div>
            <h2 className="text-lg font-black" style={{ letterSpacing: "-0.01em" }}>
              CRM
            </h2>
            <p className="mt-1 text-[13px]" style={{ color: "var(--text-3)" }}>
              Segmentación, disparadores, pipeline, referidos y el plan de 90 días. Se abre en la nube, desde
              cualquier dispositivo.
            </p>
          </div>
          <span className="label-accent mt-auto">Entrar al CRM</span>
        </a>
      </div>
    </div>
  );
}
