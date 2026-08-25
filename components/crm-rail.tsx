"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  Workflow,
  Share2,
  TrendingUp,
  Lightbulb,
  ClipboardList,
  ListChecks,
  Upload,
  Link2,
  RefreshCw,
  Coins,
} from "lucide-react";

const NAV = [
  { href: "/inicio", label: "Inicio", icon: LayoutGrid },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/cobros", label: "Cobros", icon: Coins },
  { href: "/pipeline", label: "Pipeline", icon: Workflow },
  { href: "/referidos", label: "Referidos", icon: Share2 },
  { href: "/metricas", label: "Métricas", icon: TrendingUp },
  { href: "/contenido", label: "Contenido", icon: Lightbulb },
  { href: "/diagnosticos", label: "Diagnósticos", icon: ClipboardList },
  { href: "/plan-90-dias", label: "Plan 90 días", icon: ListChecks },
  { href: "/importar", label: "Importar", icon: Upload },
  { href: "/vinculacion", label: "Vinculación", icon: Link2 },
  { href: "/sincronizacion", label: "Sincronización", icon: RefreshCw },
];

const ICON_SIZE = 19;
const ITEM_CLS =
  "rail-item relative flex items-center justify-center w-11 h-11 min-[700px]:w-[42px] min-[700px]:h-[42px] group no-print";

export function CrmRail() {
  const pathname = usePathname();

  // La ventana principal (elegir Dashboard / CRM) y el login no llevan rail.
  if (pathname === "/" || pathname === "/login") return null;

  return (
    <nav
      className="no-print fixed z-[100] flex border-t px-2
        bottom-0 left-0 right-0 h-14 flex-row items-center justify-around
        min-[700px]:top-0 min-[700px]:right-auto min-[700px]:bottom-0 min-[700px]:h-screen
        min-[700px]:w-16 min-[700px]:flex-col min-[700px]:justify-start min-[700px]:items-center
        min-[700px]:gap-1 min-[700px]:py-[18px] min-[700px]:px-0 min-[700px]:border-t-0 min-[700px]:border-r"
      style={{ background: "var(--rail)", borderColor: "var(--border-token)" }}
    >
      <Link
        href="/"
        className="hidden min-[700px]:flex items-center justify-center w-9 h-9 rounded-[11px] mb-4"
        style={{ background: "var(--green)" }}
        title="Volver a la ventana principal"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/driver-iso-black.svg" alt="Driver Capital" width={22} height={22} />
      </Link>

      {NAV.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} className={ITEM_CLS} data-active={active}>
            <Icon size={ICON_SIZE} strokeWidth={2} />
            <span
              className="hidden min-[700px]:block absolute left-[52px] whitespace-nowrap rounded-md border px-2.5 py-1 text-xs opacity-0 pointer-events-none transition-opacity duration-150 group-hover:opacity-100 z-[200]"
              style={{ background: "var(--surface-2)", borderColor: "var(--border-token)", color: "var(--text)" }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
