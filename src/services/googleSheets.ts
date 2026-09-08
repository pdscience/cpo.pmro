import type { Operacao } from "@/types";

const GOOGLE_APPS_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SHEETS_API_URL || "";

// Debug: Log the URL being used
console.log("=== Google Sheets API Configuration ===");
console.log(
  "Environment variable:",
  import.meta.env.VITE_GOOGLE_SHEETS_API_URL ? "SET" : "NOT SET",
);
console.log("URL value:", GOOGLE_APPS_SCRIPT_URL);
console.log("=====================================");

if (!GOOGLE_APPS_SCRIPT_URL) {
  console.error(
    "URL da API do Google Sheets não configurada. Defina VITE_GOOGLE_SHEETS_API_URL no arquivo .env",
  );
  alert("Erro: URL da API não configurada. Configure no arquivo .env");
} else if (
  GOOGLE_APPS_SCRIPT_URL.includes("YOUR_DEPLOYMENT_ID") ||
  GOOGLE_APPS_SCRIPT_URL.includes("YOUR_")
) {
  console.error(
    "URL da API do Google Sheets contém placeholder. Atualize o arquivo .env com o ID correto do seu deployment",
  );
  alert(
    "Erro: A URL contém um placeholder. Atualize o arquivo .env com o ID correto do Google Apps Script",
  );
}

interface SheetResponse {
  status: string;
  data?: Operacao[];
  message?: string;
}

export const googleSheetsService = {
  async listarOperacoes(): Promise<Operacao[]> {
    try {
      const url = GOOGLE_APPS_SCRIPT_URL;
      console.log("Fetching operations from:", url);
      const response = await fetch(url, {
        method: "POST",
        body: new URLSearchParams({ action: "list" }),
      });
      const data: SheetResponse = await response.json();

      if (data.status === "success" && data.data) {
        return data.data.map((op) => this.mapearOperacao(op as unknown as Record<string, unknown>));
      }
      return [];
    } catch (error) {
      console.error("Erro ao listar operações:", error);
      return [];
    }
  },

  async buscarOperacao(id: string): Promise<Operacao | null> {
    try {
      const url = GOOGLE_APPS_SCRIPT_URL;
      const response = await fetch(url, {
        method: "POST",
        body: new URLSearchParams({ action: "get", id }),
      });
      const data: SheetResponse = await response.json();

      if (data.status === "success" && data.data) {
        return this.mapearOperacao(data.data as unknown as Record<string, unknown>);
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar operação:", error);
      return null;
    }
  },

  async criarOperacao(
    operacao: Omit<
      Operacao,
      "id" | "status" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
    >,
  ): Promise<boolean> {
    try {
      const url = `${GOOGLE_APPS_SCRIPT_URL}?action=create`;
      const response = await fetch(url, {
        method: "POST",
        body: new URLSearchParams({
          data: JSON.stringify({
            diaInicio: operacao.diaInicio,
            totalDias: operacao.totalDias,
            organizacaoPolicialMilitar: operacao.organizacaoPolicialMilitar,
            municipio: operacao.municipio,
            empregoPoliciciamento: operacao.empregoPoliciciamento,
            nomeOperacaoApoio: operacao.nomeOperacaoApoio,
            area: operacao.area,
            orgaoDemandante: operacao.orgaoDemandante,
            numeroSei: operacao.numeroSei,
            qtdeEfetivo: operacao.qtdeEfetivo,
            qtdeViaturas: operacao.qtdeViaturas,
            recursoFinanceiroEmpregado: operacao.recursoFinanceiroEmpregado,
            valorGasto: operacao.valorGasto,
            codOperacaoSiseg: operacao.codOperacaoSiseg,
          }),
        }),
      });
      const data = await response.json();
      return data.status === "success";
    } catch (error) {
      console.error("Erro ao criar operação:", error);
      return false;
    }
  },

  async atualizarOperacao(id: string, operacao: Partial<Operacao>): Promise<boolean> {
    try {
      const url = `${GOOGLE_APPS_SCRIPT_URL}?action=update&id=${id}`;
      const response = await fetch(url, {
        method: "POST",
        body: new URLSearchParams({
          data: JSON.stringify(operacao),
        }),
      });
      const data = await response.json();
      return data.status === "success";
    } catch (error) {
      console.error("Erro ao atualizar operação:", error);
      return false;
    }
  },

  async excluirOperacao(id: string): Promise<boolean> {
    try {
      const url = GOOGLE_APPS_SCRIPT_URL;
      const response = await fetch(url, {
        method: "POST",
        body: new URLSearchParams({ action: "delete", id }),
      });
      const data = await response.json();
      return data.status === "success";
    } catch (error) {
      console.error("Erro ao excluir operação:", error);
      return false;
    }
  },

  async sincronizar(
    operacoes: Record<string, unknown>[],
  ): Promise<{ success: boolean; total?: number; message?: string }> {
    try {
      const url = `${GOOGLE_APPS_SCRIPT_URL}?action=sync`;
      const response = await fetch(url, {
        method: "POST",
        body: new URLSearchParams({
          data: JSON.stringify(operacoes),
        }),
      });
      const data = await response.json();
      return {
        success: data.status === "success",
        total: data.total,
        message: data.message,
      };
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      return { success: false, message: String(error) };
    }
  },

  mapearOperacao(data: Record<string, unknown>): Operacao {
    const normalize = (text: string) =>
      text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    const getVal = (possibleKeys: string[], defaultValue: any = "") => {
      const keys = possibleKeys.map(normalize);
      for (const [key, value] of Object.entries(data)) {
        if (keys.includes(normalize(key))) {
          return value;
        }
      }
      return defaultValue;
    };

    const standardizeDate = (val: any): string => {
      if (!val) return "";
      const str = String(val).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
      const parts = str.split(/[\/\-.]/);
      if (parts.length === 3) {
        const p0 = parts[0] || "";
        const p1 = parts[1] || "";
        const p2 = parts[2] || "";
        if (p2.length === 4) return `${p2}-${p1.padStart(2, "0")}-${p0.padStart(2, "0")}`;
        if (p0.length === 4) return `${p0}-${p1.padStart(2, "0")}-${p2.padStart(2, "0")}`;
      }
      return str;
    };

    return {
      id: String(getVal(["id", "ID"])),
      diaInicio: standardizeDate(getVal(["diaInicio", "DATA DE INÍCIO", "dia de início"])),
      totalDias: Number(getVal(["totalDias", "TOTAL DE DIAS", "total de dias"], 1)),
      organizacaoPolicialMilitar: String(
        getVal([
          "organizacaoPolicialMilitar",
          "ORGANIZAÇÃO POLICIAL MILITAR",
          "organização",
          "BPM",
        ]),
      ),
      municipio: String(getVal(["municipio", "MUNICÍPIO", "MUNICÍPIO/DISTRITO"])),
      empregoPoliciciamento: String(
        getVal(["empregoPoliciciamento", "EMPREGO DE POLICIAMENTO", "emprego"]),
      ),
      nomeOperacaoApoio: String(
        getVal(["nomeOperacaoApoio", "NOME DA OPERAÇÃO/APOIO", "nome operação"]),
      ),
      area: String(getVal(["area", "ÁREA"])),
      orgaoDemandante: String(
        getVal(["orgaoDemandante", "ÓRGÃO DEMANDANTE", "orgão", "orgão demandante"]),
      ),
      numeroSei: String(getVal(["numeroSei", "Nº SEI", "numero_sei", "SEI"])),
      qtdeEfetivo: Number(getVal(["qtdeEfetivo", "QTDE EFETIVO", "efetivo"], 0)),
      qtdeViaturas: Number(getVal(["qtdeViaturas", "QTDE VIATURAS", "viaturas"], 0)),
      recursoFinanceiroEmpregado: Number(
        getVal(
          [
            "recursoFinanceiroEmpregado",
            "RECURSOS FINANCEIROS EMPREGADOS",
            "RECURSO FINANCEIRO EMPREGADO",
            "RECURSO EMPREGADO",
            "recurso",
          ],
          0,
        ),
      ),
      valorGasto: Number(getVal(["valorGasto", "VALOR GASTO", "gasto"], 0)),
      codOperacaoSiseg: String(
        getVal(["codOperacaoSiseg", "CÓD. OPERAÇÃO SISEG", "cod_siseg", "CÓD. SISEG"]),
      ),
      comandoRegional: String(getVal(["comandoRegional", "COMANDO REGIONAL", "CRP"])),
      origem: getVal(["origem"]) as any,
      status: getVal(["status", "STATUS"], "rascunho") as Operacao["status"],
      createdAt: String(getVal(["createdAt", "CRIADO EM", "createdAt"], new Date().toISOString())),
      updatedAt: String(
        getVal(["updatedAt", "ATUALIZADO EM", "updatedAt"], new Date().toISOString()),
      ),
      createdBy: String(getVal(["createdBy", "CRIADO POR", "createdBy"], "sistema")),
      updatedBy: String(getVal(["updatedBy", "ATUALIZADO POR", "updatedBy"], "sistema")),
    };
  },
};
