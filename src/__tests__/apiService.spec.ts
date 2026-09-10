import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiService } from "@/services/apiGoogleSheets";

const URL = "https://script.google.com/macros/s/x/exec";

describe("apiService.listarOperacoes", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retorna [] quando nenhuma URL está configurada", async () => {
    await expect(apiService.listarOperacoes()).resolves.toEqual([]);
  });

  it("lança erro útil quando a API está bloqueada (falha de rede/CORS)", async () => {
    localStorage.setItem("cpo_api_url", URL);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(apiService.listarOperacoes()).rejects.toThrow(/não foi possível conectar/i);
  });

  it("lança erro útil quando a resposta não é JSON (página de acesso negado)", async () => {
    localStorage.setItem("cpo_api_url", URL);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => {
          throw new SyntaxError("Unexpected token < in JSON at position 0");
        },
      }),
    );

    await expect(apiService.listarOperacoes()).rejects.toThrow(/403/i);
  });

  it("retorna as operações quando a API responde com sucesso", async () => {
    localStorage.setItem("cpo_api_url", URL);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: "success", data: [{ id: "1" }] }),
      }),
    );

    await expect(apiService.listarOperacoes()).resolves.toEqual([{ id: "1" }]);
  });
});