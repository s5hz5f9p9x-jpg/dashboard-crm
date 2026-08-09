"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";
import { capturarIdeaRapida } from "@/app/actions/contenido";

export function CapturaRapidaIdea() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [pending, startTransition] = useTransition();

  function capturar() {
    if (!idea.trim()) return;
    startTransition(async () => {
      await capturarIdeaRapida(idea);
      setIdea("");
      toast.success("Idea guardada. Después la clasificás.");
      router.refresh();
    });
  }

  return (
    <div
      className="flex items-center gap-2 rounded-md border p-2"
      style={{ background: "rgba(224,160,42,.10)", borderColor: "rgba(224,160,42,.25)" }}
    >
      <Lightbulb className="h-4 w-4 shrink-0" style={{ color: "var(--warn)" }} />
      <Input
        placeholder="Anotá una idea de contenido en cinco segundos..."
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") capturar();
        }}
        className="h-8 border-none bg-transparent shadow-none focus-visible:ring-0"
      />
      <Button size="sm" onClick={capturar} disabled={pending || !idea.trim()}>
        Guardar
      </Button>
    </div>
  );
}
