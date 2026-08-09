import { listarClientes } from "@/lib/clientes";
import { ClientesTable } from "@/components/clientes-table";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clientes = await listarClientes();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <p className="text-muted-foreground text-sm">{clientes.length} clientes en la base.</p>
      </div>
      <ClientesTable data={clientes} />
    </div>
  );
}
