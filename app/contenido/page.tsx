import { listarIdeasContenido } from "@/app/actions/contenido";
import { CapturaRapidaIdea } from "@/components/captura-rapida-idea";
import { IdeasContenidoTable } from "@/components/ideas-contenido-table";
import { ProporcionPilares } from "@/components/proporcion-pilares";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ContenidoPage() {
  const ideas = await listarIdeasContenido();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Contenido</h1>
        <p className="text-muted-foreground text-sm">{ideas.length} ideas en el banco.</p>
      </div>

      <CapturaRapidaIdea />

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <IdeasContenidoTable ideas={ideas} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Proporción por pilar</CardTitle>
          </CardHeader>
          <CardContent>
            <ProporcionPilares ideas={ideas} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
