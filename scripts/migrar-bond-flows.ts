/**
 * Migra los cronogramas hardcodeados del dashboard (src/lib/bondFlows.ts) a la
 * tabla bond_flows de Supabase, para que el CRM y el dashboard lean una única
 * fuente de verdad.
 *
 * Sólo inserta los tickers que NO están ya en la tabla: los que están cargados
 * por la pantalla de Carga son correcciones manuales y el dashboard les da
 * prioridad sobre el archivo, así que pisarlos sería un retroceso.
 *
 * Uso:  tsx scripts/migrar-bond-flows.ts [--aplicar]
 * Sin --aplicar hace un ensayo y no escribe nada.
 */

import fs from "fs";
import { getSupabaseAdmin, type BondFlowRow } from "../lib/supabase/admin";

const RUTA_ESTATICO =
  "/Users/ulisesviolo/Documents/Dashboard tenencias/src/lib/bondFlows.ts";

interface Flow {
  date: string;
  interest: number;
  amort: number;
}

/**
 * Los genéricos de supabase-js no resuelven los nombres de tabla sin los tipos
 * generados por su CLI, así que declaramos acá la porción de la API que usamos.
 * El runtime ya está verificado contra la tabla real.
 */
interface TablaBondFlows {
  select(cols: string): Promise<{ data: BondFlowRow[] | null; error: { message: string } | null }>;
  insert(filas: BondFlowRow[]): Promise<{ error: { message: string } | null }>;
}
type ClienteBondFlows = { from(tabla: "bond_flows"): TablaBondFlows };

function leerCronogramasEstaticos(): Record<string, Flow[]> {
  const src = fs.readFileSync(RUTA_ESTATICO, "utf8");
  const inicio = src.indexOf("{", src.indexOf("BOND_FLOWS"));
  const fin = src.lastIndexOf("}");
  if (inicio < 0 || fin <= inicio) throw new Error("No pude ubicar el objeto BOND_FLOWS en el archivo.");
  const json = src.slice(inicio, fin + 1).replace(/,(\s*[}\]])/g, "$1");
  return JSON.parse(json) as Record<string, Flow[]>;
}

async function main() {
  const aplicar = process.argv.includes("--aplicar");
  const db = getSupabaseAdmin() as unknown as ClienteBondFlows;

  const estaticos = leerCronogramasEstaticos();
  console.log(`Cronogramas en el archivo del dashboard: ${Object.keys(estaticos).length} tickers`);

  const { data: existentes, error } = await db.from("bond_flows").select("ticker, flow_date, interest, amort");
  if (error) throw new Error("leyendo bond_flows: " + error.message);

  const yaEnBase = new Set((existentes ?? []).map((r) => r.ticker as string));
  console.log(`Ya en la tabla bond_flows: ${yaEnBase.size} tickers (${existentes?.length ?? 0} filas)`);

  // Respaldo de lo que hay hoy, por si hay que volver atrás.
  fs.mkdirSync("backups-supabase", { recursive: true });
  const respaldo = `backups-supabase/bond_flows-respaldo-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "")}.json`;
  fs.writeFileSync(respaldo, JSON.stringify(existentes, null, 2));
  console.log(`Respaldo de la tabla actual: ${respaldo}`);

  const aInsertar = Object.entries(estaticos).filter(([ticker]) => !yaEnBase.has(ticker));
  const pisados = Object.keys(estaticos).filter((t) => yaEnBase.has(t));

  console.log(`\nSe van a insertar ${aInsertar.length} tickers nuevos.`);
  if (pisados.length) {
    console.log(`Se SALTEAN ${pisados.length} que ya están cargados en la base (gana la base): ${pisados.join(", ")}`);
  }

  const filas = aInsertar.flatMap(([ticker, flows]) =>
    flows.map((f) => ({ ticker, flow_date: f.date, interest: f.interest, amort: f.amort })),
  );
  console.log(`Total de filas a insertar: ${filas.length}`);

  if (!aplicar) {
    console.log("\n(ensayo — no se escribió nada. Volvé a correr con --aplicar)");
    return;
  }

  for (let i = 0; i < filas.length; i += 500) {
    const lote = filas.slice(i, i + 500);
    const { error: errIns } = await db.from("bond_flows").insert(lote);
    if (errIns) throw new Error(`insertando filas ${i}-${i + lote.length}: ${errIns.message}`);
    console.log(`  insertadas ${Math.min(i + lote.length, filas.length)}/${filas.length}`);
  }

  const { data: final, error: errFin } = await db.from("bond_flows").select("ticker");
  if (errFin) throw new Error("verificando: " + errFin.message);
  const tickersFinal = new Set((final ?? []).map((r) => r.ticker as string));
  console.log(`\nListo. La tabla ahora tiene ${tickersFinal.size} tickers y ${final?.length ?? 0} filas.`);
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
