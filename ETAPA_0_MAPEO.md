# Etapa 0 — Reconocimiento del esquema Supabase y mapeo propuesto

Fecha: 2026-08-06
Conexión usada: pooler de sesión (`aws-0-sa-east-1.pooler.supabase.com:5432`), rol `crm_readonly`, solo `SELECT`.

## 1. Esquema real encontrado

10 tablas en `public`. RLS estaba activo con políticas que solo daban acceso al rol `authenticated` — se agregó una política `crm_readonly_select` (`FOR SELECT TO crm_readonly USING (true)`) en cada tabla. `crm_readonly` no tiene grants de escritura, así que esto no habilita ningún INSERT/UPDATE/DELETE.

| Tabla | Filas | Uso real |
|---|---|---|
| `client_accounts` | 177 | **La identidad de cliente real de la app.** `id (uuid)`, `broker`, `account_code`, `raw_name`, `client_id` (siempre NULL) |
| `clients` | 0 | Existe en el esquema pero no se usa. Ignorar. |
| `positions` | 1229 | Tenencias actuales por cuenta: `account_id`, `ticker`, `quantity`, `snapshot_value`, `snapshot_ccy`, `asof` |
| `assets` | 217 | Maestro de instrumentos: `ticker`, `description`, `asset_class`, `currency` |
| `bond_flows` | 144 | Cronograma de pagos (interés/amortización) por ticker de bono/ON, 9 tickers cubiertos |
| `asset_aliases` | 0 | Vacía |
| `asset_overrides` | 0 | Vacía |
| `fci_map` | 0 | Vacía |
| `movements` | 0 | Vacía |
| `uploads` | 0 | Vacía (raro — esperaría historial de imports; puede ser que el broker cargue directo sin loguear en esta tabla) |

**Solo hay un `asof` en `positions`: 2026-08-04.** Confirma lo que dice el SPEC 2.3: Supabase guarda el estado actual nada más, no historia. El `aum_snapshots` del CRM es indispensable.

## 2. Identidad de cliente — el hallazgo clave

La tabla `clients` no se usa (0 filas, `client_id` siempre NULL en `client_accounts`). La unidad real es **`client_accounts`**, una fila por cuenta de broker: `(broker, account_code, raw_name)`.

Crucé los 177 `account_code` contra el Excel:

| Broker | Cuentas en Supabase | Matchean por `Comitente`/`comitente` | Matchean también por `comitentepa` (cuentas "Internacional") | Sin match en el Excel |
|---|---|---|---|---|
| IEB | 117 | 117/117 (100%) | — | 0 |
| BALANZ | 60 | 55/60 | +2 (usando `comitentepa`) | 3 (`1584186`, `329754`, `395559` — no están en ninguna columna del Excel) |

Conclusión: **`account_code` = `Comitente` (IEB) / `comitente` o `comitentepa` (BALANZ)**, como texto. Los 3 sin match van directo a la pantalla de "sin vincular" de la Etapa 2 (probablemente cuentas nuevas o cerradas fuera del rango de este export).

**Problema de cardinalidad:** al menos 4 personas tienen más de una `client_account` (mismo nombre, distinto `account_code`):

- `LERCARI NICOLAS` → BALANZ `12979` y BALANZ `318366`
- `GARCIA SALVETTI FRANCO MATIAS` → BALANZ `16874` e IEB `300033`
- `VIOLO GONZALEZ ULISES` → BALANZ `316664` e IEB `144161`
- `LORDA VENERO GONZALO MATIAS` → IEB `300154` e IEB `356937`

El campo `clientes.supabase_id` (texto único) del SPEC 4.1 asume 1 cliente = 1 cuenta Supabase. No alcanza para estos casos.

**Propongo agregar una tabla de vínculo `cliente_cuentas_supabase (cliente_id, client_account_id, broker, account_code)`** en vez de (o adicional a) `supabase_id`, y que el AUM de un cliente sea la suma de todas sus cuentas vinculadas. Es el único cambio de esquema respecto al SPEC — lo marco para tu aprobación antes de tocar código, como pide la sección 2.

## 3. AUM y composición de cartera

`positions` tiene `snapshot_value` ya en la moneda de la posición (`snapshot_ccy`: ARS o USD, ambas conviven — 704 filas en ARS, 525 en USD). **No hay ninguna tabla de tipo de cambio en el esquema.** Para totalizar el AUM de una cuenta en USD (que es lo que pide el SPEC en toda la app) hay que convertir las posiciones en ARS.

Esto es una pregunta para vos, no algo que pueda inferir del esquema: **¿la app de Vercel ya muestra un AUM total en USD en algún lado? Si es así, ¿con qué tipo de cambio lo arma (dólar MEP, CCL, oficial)?** Si no lo hace, el CRM va a tener que aplicar su propia conversión al sincronizar (con una fuente de tipo de cambio a definir) — lo marco como pendiente de la Etapa 2, no bloquea la Etapa 1.

La composición de cartera (`aum_snapshots.composicion` del SPEC 4.2) sale de:
```sql
SELECT a.asset_class AS clase, p.ticker AS instrumento, p.snapshot_value AS monto, p.snapshot_ccy AS moneda
FROM positions p LEFT JOIN assets a ON a.ticker = p.ticker
WHERE p.account_id = ...
```

## 4. Vencimientos de instrumentos

`bond_flows (ticker, flow_date, interest, amort)` tiene el cronograma de pagos de 9 tickers de bonos/ONs (de ~46+2 en total en `assets` con clase Bonos soberanos/Obligaciones Negociables). Cobertura parcial. El disparador `vencimiento_proximo` puede tomar `MAX(flow_date)` por ticker como vencimiento final, pero solo va a disparar para esos 9 — el resto de los bonos en cartera no tiene fecha de vencimiento disponible en Supabase. No hay forma de completar esto sin otra fuente (¿tenés un maestro de vencimientos en otro lado, o lo cargamos a mano en `configuracion`/una tabla nueva?).

## 5. El Excel tiene dos hojas con estructura distinta

- **`IEB`** (163 filas, 26 columnas): tiene email, teléfono, fecha de nacimiento, perfil de riesgo, PEP/FATCA, referenciador. Es la hoja rica en datos de contacto/KYC.
- **`BALANZ`** (71 filas, 17 columnas): sin email ni teléfono. Tiene `asesor`, `equipo`, `referidor`, fecha de alta, actividad últimos 12 meses.

Mapeo propuesto de columnas del Excel a `clientes`:

| Campo `clientes` | Fuente IEB | Fuente BALANZ |
|---|---|---|
| nombre + apellido | `Cliente` (partir el nombre completo) | `cuenta` (ídem) |
| email | `Email` | *(no disponible — quedará vacío, no bloquea el import)* |
| telefono | `Telefono` | *(no disponible)* |
| fecha_alta | `Alta` | `Fecha de Alta` |
| estado | `Activa` (`activa`/otro → activo/no) | `activo` (0/1) — usar además `Activo ult. 12 meses` como señal, no como estado |
| perfil_riesgo | `Perfil` (`ARRIESGADO`→agresivo, `MODERADO`→moderado, `-`→sin dato) | *(no disponible)* |
| origen (si vino de referido) | `Referenciador` | `referidor` |
| notas | `Profesion`, `TipoPersona`, domicilio (como texto libre) | `asesor`, `equipo`, `unidad`, `Esquema Comisiones` |
| — (no mapea a nada del CRM) | `PEP`, `FATCA`, `SujetoObligado`, `Cuit`, `OficialCuenta`, `Productor`, `numeroProductor` | `arancel`, `negocio`, `primerfondeo`, `Es Juridica` |

Como BALANZ no tiene email/teléfono, la vinculación automática por email de la sección 7 del SPEC no va a funcionar para esos ~60 clientes — para ellos la vinculación en la Etapa 2 va a depender de nombre normalizado + confirmación manual (que ya está previsto: "nunca vincules automáticamente por similitud de nombre", solo sugerir).

## 6. Preguntas resueltas

1. **Cambio de `supabase_id` a tabla de vínculo `cliente_cuentas_supabase`:** no toca Supabase para nada — es una tabla nueva del lado del CRM (SQLite local). El CRM se conecta con `crm_readonly`, que ni siquiera tiene permisos de escritura. El dashboard de Vercel queda exactamente igual. **Aprobado por el usuario.**

2. **Conversión ARS → USD del AUM:** se resuelve con la API pública `https://data912.com/live/mep`, que devuelve cotizaciones de CEDEARs y bonos con precio en ARS y en USD. El campo `mark` del bono `AL30` (o `GD30` si `AL30` no está ese día) es el tipo de cambio MEP implícito.

   Diseño para la sincronización (Etapa 2):
   - Al sincronizar, pedir la API y tomar el `mark` de `AL30` (fallback `GD30`) como MEP del momento.
   - Posiciones con `snapshot_ccy = 'USD'` → usar `snapshot_value` tal cual.
   - Posiciones con `snapshot_ccy = 'ARS'` → dividir `snapshot_value` por el MEP obtenido.
   - Sumar todas las posiciones de todas las cuentas vinculadas al cliente → `aum_usd` del snapshot.
   - Nueva tabla chica `tipo_cambio_historial (fecha, mep_ars_usd, fuente)` para auditar con qué tipo de cambio se calculó el AUM de cada día.

## 7. Preguntas abiertas (no bloquean la Etapa 1)

3. Para los ~37 bonos/ONs sin `bond_flows` cargado, **¿tenés en algún lado las fechas de vencimiento**, o dejamos el disparador `vencimiento_proximo` andando solo para los 9 que sí tienen datos, por ahora?
4. Los 3 `account_code` de BALANZ sin match en el Excel (`1584186`, `329754`, `395559` — Rosa Federico Pascual, Dadone Lucas, Paesani César Alejandro) — ¿los conocés? ¿son cuentas nuevas que faltan en el Excel, o hay que actualizar el export?

Ambas quedan para resolver en la Etapa 2 (pantalla de vinculación / configuración de disparadores), sin bloquear el arranque de la Etapa 1.
