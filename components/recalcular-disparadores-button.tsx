"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { regenerarDisparadores } from "@/app/actions/disparadores";

export function RecalcularDisparadoresButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function recalcular() {
    startTransition(async () => {
      const r = await regenerarDisparadores();
      toast.success(`${r.generados} disparadores nuevos${r.colapsados > 0 ? `, ${r.colapsados} cuentas colapsadas por exceso` : ""}.`);
      router.refresh();
    });
  }

  return (
    <Button size="sm" variant="outline" onClick={recalcular} disabled={pending}>
      <RefreshCw className={pending ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> Recalcular
    </Button>
  );
}
