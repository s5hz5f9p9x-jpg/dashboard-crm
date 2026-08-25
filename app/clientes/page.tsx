import { listarClientes } from "@/lib/clientes";
import { ClientesTable } from "@/components/clientes-table";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clientes = await listarClientes();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-black" style={{ letterSpacing: "-0.01em" }}>
          Clientes
        </h1>
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          Ordenados por AUM. Tocá una columna para reordenar, o una fila para abrir la ficha.
        </p>
      </div>
      <ClientesTable data={clientes} />
    </div>
  );
}
