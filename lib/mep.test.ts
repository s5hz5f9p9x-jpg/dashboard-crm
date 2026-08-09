import { describe, expect, it, vi } from "vitest";
import { obtenerMep } from "./mep";

function mockFetch(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  }) as unknown as typeof fetch;
}

describe("obtenerMep", () => {
  it("usa el mark de AL30 cuando está disponible", async () => {
    const fetchFn = mockFetch([
      { ticker: "AL30", mark: 1520.89 },
      { ticker: "GD30", mark: 1521.46 },
    ]);
    const r = await obtenerMep(fetchFn);
    expect(r.ticker).toBe("AL30");
    expect(r.mepArsUsd).toBe(1520.89);
  });

  it("cae a GD30 si AL30 no está en la respuesta", async () => {
    const fetchFn = mockFetch([{ ticker: "GD30", mark: 1521.46 }]);
    const r = await obtenerMep(fetchFn);
    expect(r.ticker).toBe("GD30");
    expect(r.mepArsUsd).toBe(1521.46);
  });

  it("cae a GD30 si el mark de AL30 es inválido", async () => {
    const fetchFn = mockFetch([
      { ticker: "AL30", mark: 0 },
      { ticker: "GD30", mark: 1521.46 },
    ]);
    const r = await obtenerMep(fetchFn);
    expect(r.ticker).toBe("GD30");
  });

  it("explota si no hay AL30 ni GD30", async () => {
    const fetchFn = mockFetch([{ ticker: "AAPL", mark: 1500 }]);
    await expect(obtenerMep(fetchFn)).rejects.toThrow(/AL30 ni GD30/);
  });

  it("explota si la respuesta HTTP no es ok", async () => {
    const fetchFn = mockFetch([], false, 503);
    await expect(obtenerMep(fetchFn)).rejects.toThrow(/503/);
  });
});
