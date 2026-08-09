import { describe, expect, it } from "vitest";
import { sugerirVinculo, sugerirVinculos, type ClienteLocal, type CuentaSupabase } from "./vinculacion";

const CAVA: ClienteLocal = {
  id: "cliente-1",
  nombre: "Pablo",
  apellido: "Cava",
  notas: "Otros servicios · Cuenta broker (IEB): 23957",
};

const WEHNER: ClienteLocal = {
  id: "cliente-2",
  nombre: "Guillermo",
  apellido: "Wehner",
  notas: "Ama de casa · Cuenta broker (IEB): 35561",
};

const SIN_HINT: ClienteLocal = {
  id: "cliente-3",
  nombre: "Ana",
  apellido: "Gomez",
  notas: "",
};

describe("sugerirVinculo", () => {
  it("da confianza fuerte cuando coincide el hint de comitente guardado en notas", () => {
    const cuenta: CuentaSupabase = { id: "acc-1", broker: "IEB", account_code: "23957", raw_name: "Cava Pablo" };
    const r = sugerirVinculo(cuenta, [CAVA, WEHNER, SIN_HINT]);
    expect(r.confianza).toBe("fuerte");
    expect(r.clienteId).toBe("cliente-1");
  });

  it("no confunde cuentas de distinto broker con el mismo código", () => {
    const cuenta: CuentaSupabase = { id: "acc-1", broker: "BALANZ", account_code: "23957", raw_name: "Otra Persona" };
    const r = sugerirVinculo(cuenta, [CAVA]);
    expect(r.confianza).not.toBe("fuerte");
  });

  it("cae a confianza media por nombre normalizado cuando no hay hint", () => {
    const cuenta: CuentaSupabase = { id: "acc-2", broker: "BALANZ", account_code: "999999", raw_name: "GOMEZ ANA" };
    const r = sugerirVinculo(cuenta, [CAVA, WEHNER, SIN_HINT]);
    expect(r.confianza).toBe("media");
    expect(r.clienteId).toBe("cliente-3");
  });

  it("el orden de nombre/apellido no afecta el match por nombre normalizado", () => {
    const cuenta: CuentaSupabase = { id: "acc-3", broker: "BALANZ", account_code: "1", raw_name: "Wehner Guillermo" };
    const r = sugerirVinculo(cuenta, [CAVA, WEHNER]);
    expect(r.confianza).toBe("media");
    expect(r.clienteId).toBe("cliente-2");
  });

  it("sin coincidencia devuelve sin_sugerencia y clienteId null", () => {
    const cuenta: CuentaSupabase = { id: "acc-4", broker: "IEB", account_code: "000", raw_name: "Nadie Conocido" };
    const r = sugerirVinculo(cuenta, [CAVA, WEHNER, SIN_HINT]);
    expect(r.confianza).toBe("sin_sugerencia");
    expect(r.clienteId).toBeNull();
  });

  it("nunca vincula solo — siempre devuelve una sugerencia para confirmar, no un vínculo hecho", () => {
    const cuenta: CuentaSupabase = { id: "acc-1", broker: "IEB", account_code: "23957", raw_name: "Cava Pablo" };
    const r = sugerirVinculo(cuenta, [CAVA]);
    // el resultado es una sugerencia (con razón explicable), no una escritura
    expect(r).toHaveProperty("razon");
    expect(typeof r.razon).toBe("string");
  });
});

describe("sugerirVinculos", () => {
  it("devuelve una sugerencia por cada cuenta", () => {
    const cuentas: CuentaSupabase[] = [
      { id: "acc-1", broker: "IEB", account_code: "23957", raw_name: "Cava Pablo" },
      { id: "acc-2", broker: "IEB", account_code: "35561", raw_name: "Wehner Guillermo" },
    ];
    const resultado = sugerirVinculos(cuentas, [CAVA, WEHNER]);
    expect(resultado.size).toBe(2);
    expect(resultado.get("acc-1")?.clienteId).toBe("cliente-1");
    expect(resultado.get("acc-2")?.clienteId).toBe("cliente-2");
  });
});
