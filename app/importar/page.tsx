"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, Upload } from "lucide-react";
import {
  CAMPOS_DESTINO,
  sugerirMapeo,
  validarFilas,
  type Mapeo,
  type ResultadoValidacion,
} from "@/lib/importador";
import { importarClientes, type ModoImportacion, type ResumenImportacion } from "@/app/actions/importar";

type Paso = "subir" | "mapear" | "revisar" | "resultado";

const NO_MAPEAR = "__no_mapear__";

export default function ImportarPage() {
  const [paso, setPaso] = useState<Paso>("subir");
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [hoja, setHoja] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapeo, setMapeo] = useState<Mapeo>({});
  const [modo, setModo] = useState<ModoImportacion>("ambos");
  const [resultado, setResultado] = useState<ResultadoValidacion | null>(null);
  const [resumen, setResumen] = useState<ResumenImportacion | null>(null);
  const [importando, setImportando] = useState(false);

  const previewRows = useMemo(() => rows.slice(0, 10), [rows]);

  function cargarHoja(wb: XLSX.WorkBook, nombreHoja: string) {
    const ws = wb.Sheets[nombreHoja];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
    const hdrs = json.length > 0 ? Object.keys(json[0]) : [];
    setHoja(nombreHoja);
    setHeaders(hdrs);
    setRows(json);
    setMapeo(sugerirMapeo(hdrs));
    setResultado(null);
    setPaso("mapear");
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array", cellDates: true });
      setWorkbook(wb);
      cargarHoja(wb, wb.SheetNames[0]);
    };
    reader.readAsArrayBuffer(file);
  }

  function handleValidar() {
    const r = validarFilas(rows, mapeo, hoja);
    setResultado(r);
    setPaso("revisar");
  }

  async function handleImportar() {
    if (!resultado) return;
    setImportando(true);
    try {
      const res = await importarClientes(resultado.filas, modo);
      setResumen(res);
      setPaso("resultado");
    } finally {
      setImportando(false);
    }
  }

  function reiniciar() {
    setPaso("subir");
    setWorkbook(null);
    setHoja("");
    setHeaders([]);
    setRows([]);
    setMapeo({});
    setResultado(null);
    setResumen(null);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Importar clientes</h1>
        <p className="text-muted-foreground text-sm">
          Subí el Excel o CSV con la base actual. Vas a poder mapear las columnas y revisar todo antes de importar nada.
        </p>
      </div>

      {paso === "subir" && (
        <Card>
          <CardHeader>
            <CardTitle>1. Subir archivo</CardTitle>
            <CardDescription>.xlsx o .csv. Si tiene varias hojas, elegís cuál importar primero.</CardDescription>
          </CardHeader>
          <CardContent>
            <label className="border-muted-foreground/30 hover:bg-muted/50 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors">
              <Upload className="text-muted-foreground h-8 w-8" />
              <span className="text-sm font-medium">Hacé click para elegir el archivo</span>
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
            </label>
          </CardContent>
        </Card>
      )}

      {paso === "mapear" && workbook && (
        <>
          {workbook.SheetNames.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Hoja</CardTitle>
                <CardDescription>El archivo tiene {workbook.SheetNames.length} hojas.</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={hoja} onValueChange={(v) => cargarHoja(workbook, v)}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workbook.SheetNames.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>2. Previsualización — {hoja}</CardTitle>
              <CardDescription>{rows.length} filas encontradas. Se muestran las primeras 10.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((r, i) => (
                    <TableRow key={i}>
                      {headers.map((h) => (
                        <TableCell key={h} className="whitespace-nowrap">
                          {String(r[h] ?? "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Mapeo de columnas</CardTitle>
              <CardDescription>
                Para cada campo del CRM, elegí qué columna del archivo le corresponde. Se autocompletó por similitud de nombre — corregí lo que haga falta.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {CAMPOS_DESTINO.map(({ campo, etiqueta, requerido }) => (
                <div key={campo} className="space-y-1.5">
                  <Label>
                    {etiqueta} {requerido && <span className="text-destructive">*</span>}
                  </Label>
                  <Select
                    value={mapeo[campo] ?? NO_MAPEAR}
                    onValueChange={(v) => setMapeo((m) => ({ ...m, [campo]: v === NO_MAPEAR ? null : v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_MAPEAR}>(no mapear)</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={reiniciar}>
              Cancelar
            </Button>
            <Button onClick={handleValidar}>Validar filas</Button>
          </div>
        </>
      )}

      {paso === "revisar" && resultado && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>4. Reporte de validación</CardTitle>
              <CardDescription>Revisá los errores antes de importar. Nada se guarda todavía.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {resultado.validas.length} válidas
                </Badge>
                {resultado.conErrores.length > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> {resultado.conErrores.length} con errores
                  </Badge>
                )}
                {resultado.filas.some((f) => f.advertencias.length > 0) && (
                  <Badge variant="outline" className="gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {resultado.filas.filter((f) => f.advertencias.length > 0).length} con avisos (se importan igual)
                  </Badge>
                )}
              </div>

              {resultado.filas.some((f) => f.advertencias.length > 0) && (
                <div className="max-h-60 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fila</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Aviso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultado.filas
                        .filter((f) => f.advertencias.length > 0)
                        .map((f) => (
                          <TableRow key={f.fila}>
                            <TableCell>{f.fila}</TableCell>
                            <TableCell>
                              {f.nombre} {f.apellido}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{f.advertencias.join("; ")}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {resultado.conErrores.length > 0 && (
                <div className="max-h-80 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fila</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Errores</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultado.conErrores.map((f) => (
                        <TableRow key={f.fila}>
                          <TableCell>{f.fila}</TableCell>
                          <TableCell>
                            {f.nombre} {f.apellido}
                          </TableCell>
                          <TableCell className="text-destructive text-sm">{f.errores.join("; ")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {resultado.validas.length === 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>No hay filas válidas para importar</AlertTitle>
                  <AlertDescription>Corregí el mapeo o el archivo y volvé a intentar.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {resultado.validas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>5. Modo de importación</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={modo} onValueChange={(v) => setModo(v as ModoImportacion)} className="gap-3">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="crear" id="m-crear" />
                    <Label htmlFor="m-crear">Crear solo clientes nuevos</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="actualizar" id="m-actualizar" />
                    <Label htmlFor="m-actualizar">Actualizar solo existentes (por email)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="ambos" id="m-ambos" />
                    <Label htmlFor="m-ambos">Crear nuevos y actualizar existentes</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPaso("mapear")}>
              Volver al mapeo
            </Button>
            <Button onClick={handleImportar} disabled={resultado.validas.length === 0 || importando}>
              {importando ? "Importando..." : `Importar ${resultado.validas.length} clientes`}
            </Button>
          </div>
        </>
      )}

      {paso === "resultado" && resumen && (
        <Card>
          <CardHeader>
            <CardTitle>Importación terminada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Badge variant="secondary">{resumen.creados} creados</Badge>
              <Badge variant="secondary">{resumen.actualizados} actualizados</Badge>
              {resumen.omitidos.length > 0 && <Badge variant="outline">{resumen.omitidos.length} omitidos</Badge>}
            </div>
            {resumen.omitidos.length > 0 && (
              <div className="max-h-80 overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fila</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumen.omitidos.map((o, i) => (
                      <TableRow key={i}>
                        <TableCell>{o.fila}</TableCell>
                        <TableCell>{o.nombre}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{o.motivo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/clientes">Ver clientes</Link>
              </Button>
              <Button variant="outline" onClick={reiniciar}>
                Importar otro archivo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
