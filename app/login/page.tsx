"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(false);
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    setLoading(false);
    if (r.ok) {
      const next = new URLSearchParams(window.location.search).get("next") || "/inicio";
      router.replace(next.startsWith("/") ? next : "/inicio");
      router.refresh();
    } else {
      setErr(true);
      setPw("");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="card w-full max-w-sm p-8">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ background: "var(--green)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/driver-iso-black.svg" alt="Driver Capital" width={26} height={26} />
        </div>
        <h1 className="mt-4 text-center text-lg font-black">Driver Capital</h1>
        <p className="mb-6 text-center text-sm" style={{ color: "var(--text-3)" }}>
          CRM
        </p>

        <label className="label mb-1.5 block">Contraseña</label>
        <input
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none"
          style={{ background: "var(--surface-2)", borderColor: "var(--border-token)", color: "var(--text)" }}
          placeholder="Ingresá la clave"
        />
        {err && (
          <div className="mt-2 text-sm" style={{ color: "var(--neg-soft)" }}>
            Contraseña incorrecta.
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !pw}
          className="btn-pill mt-5 w-full justify-center py-2.5 font-medium disabled:opacity-50"
          style={{ background: "var(--green)", color: "var(--bg)" }}
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
