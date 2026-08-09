import type { Metadata } from "next";
import { League_Spartan, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { CrmRail } from "@/components/crm-rail";
import "./globals.css";

// Tipografía de marca (misma dirección "Ink" del Dashboard de Tenencias):
// League Spartan para todo lo display, IBM Plex Mono para toda cifra.
const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  weight: ["300", "400", "900"],
  variable: "--font-league-spartan",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Driver Capital — CRM",
  description: "CRM operativo de Driver Capital",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${leagueSpartan.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <CrmRail />
        <div className="min-[700px]:ml-16 pb-14 min-[700px]:pb-0 flex-1 flex flex-col">
          <main className="flex-1">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
