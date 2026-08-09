import { describe, expect, it } from "vitest";
import { sugerirMapeo, validarFilas } from "./importador";

describe("sugerirMapeo", () => {
  it("sugiere columnas de la hoja IEB por similitud de nombre", () => {
    const headers = ["Comitente", "Cliente", "Email", "Telefono", "Alta", "Perfil", "Activa", "Referenciador"];
    const mapeo = sugerirMapeo(headers);
    expect(mapeo.nombre_completo).toBe("Cliente");
    expect(mapeo.email).toBe("Email");
    expect(mapeo.telefono).toBe("Telefono");
    expect(mapeo.fecha_alta).toBe("Alta");
    expect(mapeo.perfil_riesgo).toBe("Perfil");
    expect(mapeo.estado_fuente).toBe("Activa");
    expect(mapeo.origen).toBe("Referenciador");
    expect(mapeo.identificador_cuenta).toBe("Comitente");
  });

  it("sugiere columnas de la hoja BALANZ, sin email ni telefono", () => {
    const headers = ["idcuenta", "comitente", "cuenta", "Fecha de Alta", "referidor", "activo"];
    const mapeo = sugerirMapeo(headers);
    expect(mapeo.nombre_completo).toBe("cuenta");
    expect(mapeo.fecha_alta).toBe("Fecha de Alta");
    expect(mapeo.origen).toBe("referidor");
    expect(mapeo.email).toBeNull();
    expect(mapeo.telefono).toBeNull();
  });
});

describe("validarFilas", () => {
  const mapeoIEB = {
    nombre_completo: "Cliente",
    email: "Email",
    telefono: "Telefono",
    fecha_alta: "Alta",
    perfil_riesgo: "Perfil",
    estado_fuente: "Activa",
    origen: "Referenciador",
    identificador_cuenta: "Comitente",
  };

  it("separa nombre y apellido (primer token = apellido)", () => {
    const rows = [{ Cliente: "Cava Pablo", Email: "cava@x.com", Alta: "2016-03-11", Comitente: 23957 }];
    const r = validarFilas(rows, mapeoIEB, "IEB");
    expect(r.filas[0].apellido).toBe("Cava");
    expect(r.filas[0].nombre).toBe("Pablo");
    expect(r.filas[0].notas).toContain("Cuenta broker (IEB): 23957");
  });

  it("acepta fecha en formato DD/MM/YYYY y en Date de Excel", () => {
    const rows = [
      { Cliente: "Perez Juan", Alta: "11/03/2016" },
      { Cliente: "Gomez Ana", Alta: new Date(2020, 0, 15) },
    ];
    const r = validarFilas(rows, mapeoIEB);
    expect(r.filas[0].fecha_alta).toBe("2016-03-11");
    expect(r.filas[1].fecha_alta).toBe("2020-01-15");
  });

  it("marca error si falta nombre o fecha de alta", () => {
    const rows = [{ Cliente: "", Alta: "" }];
    const r = validarFilas(rows, mapeoIEB);
    expect(r.filas[0].errores).toContain("Falta el nombre");
    expect(r.filas[0].errores).toContain("Falta la fecha de alta o tiene un formato inválido");
    expect(r.validas).toHaveLength(0);
  });

  it("marca email con formato inválido", () => {
    const rows = [{ Cliente: "Perez Juan", Alta: "2020-01-01", Email: "no-es-un-email" }];
    const r = validarFilas(rows, mapeoIEB);
    expect(r.filas[0].errores.some((e) => e.includes("inválido"))).toBe(true);
  });

  it("email compartido entre dos filas: no bloquea, le saca el email a la segunda y avisa", () => {
    // Caso real: una persona y su empresa comparten el mismo email en el Excel.
    // clientes.email es único en la base — no se puede guardar dos veces — pero
    // eso no es motivo para no importar al segundo cliente.
    const rows = [
      { Cliente: "Perez Juan", Alta: "2020-01-01", Email: "dup@x.com" },
      { Cliente: "Perez Juan SA", Alta: "2020-01-01", Email: "dup@x.com" },
    ];
    const r = validarFilas(rows, mapeoIEB);
    expect(r.emailsDuplicadosEnArchivo).toEqual(["dup@x.com"]);
    expect(r.filas[0].email).toBe("dup@x.com");
    expect(r.filas[1].email).toBeNull();
    expect(r.filas[0].errores).toHaveLength(0);
    expect(r.filas[1].errores).toHaveLength(0);
    expect(r.filas[1].advertencias.some((a) => a.includes("compartido"))).toBe(true);
    expect(r.validas).toHaveLength(2);
  });

  it("normaliza estado activo/pausado según el valor de origen", () => {
    const rows = [
      { Cliente: "A A", Alta: "2020-01-01", Activa: "activa" },
      { Cliente: "B B", Alta: "2020-01-01", Activa: "inactiva" },
    ];
    const r = validarFilas(rows, mapeoIEB);
    expect(r.filas[0].estado).toBe("activo");
    expect(r.filas[1].estado).toBe("pausado");
  });

  it("filas sin errores quedan en validas y no en conErrores", () => {
    const rows = [{ Cliente: "Perez Juan", Alta: "2020-01-01", Email: "ok@x.com" }];
    const r = validarFilas(rows, mapeoIEB);
    expect(r.validas).toHaveLength(1);
    expect(r.conErrores).toHaveLength(0);
  });
});
