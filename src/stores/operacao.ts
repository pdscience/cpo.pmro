import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  Operacao,
  Usuario,
  Auditoria,
  Indicadores,
  IndicadoresOperacao,
  PerfilUsuario,
} from "@/types";
import { apiService } from "@/services/apiGoogleSheets";
import { googleSheetsService } from "@/services/googleSheets";

const STORAGE_KEY = "cpo_operacoes";
const AUDITORIA_KEY = "cpo_auditoria";

export const useOperacaoStore = defineStore("operacao", () => {
  const operacoes = ref<Operacao[]>([]);
  const usuarioAtual = ref<Usuario | null>(null);
  const auditoria = ref<Auditoria[]>([]);
  const loading = ref(false);
  const erro = ref<string | null>(null);
  const modoOffline = ref(false);

  const operacoesReais = computed(() => operacoes.value.filter((op) => op.origem !== "calendario"));

  // Carregar dados do LocalStorage ao iniciar
  function carregarDados() {
    try {
      const dados = localStorage.getItem(STORAGE_KEY);
      if (dados) {
        const parsed = JSON.parse(dados);
        if (Array.isArray(parsed)) {
          operacoes.value = parsed;
        } else {
          console.warn("Dados no localStorage não são um array válido, iniciando vazio");
        }
      }

      const dadosAuditoria = localStorage.getItem(AUDITORIA_KEY);
      if (dadosAuditoria) {
        const parsedAuditoria = JSON.parse(dadosAuditoria);
        if (Array.isArray(parsedAuditoria)) {
          auditoria.value = parsedAuditoria;
        }
      }
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
      operacoes.value = [];
      auditoria.value = [];
    }
  }

  // Salvar no LocalStorage
  function salvarDados() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(operacoes.value));
      localStorage.setItem(AUDITORIA_KEY, JSON.stringify(auditoria.value));
    } catch (e) {
      console.error("Erro ao salvar dados:", e);
    }
  }

  // Sincronizar com Google Sheets
  async function sincronizarGoogleSheets() {
    if (modoOffline.value) return;
    try {
      const result = await googleSheetsService.sincronizar(
        operacoes.value as unknown as Record<string, unknown>[],
      );
      if (result.success) {
        console.log(`Sincronizado ${result.total} operações com Google Sheets`);
      }
    } catch (e) {
      console.error("Erro ao sincronizar com Google Sheets:", e);
    }
  }

  // Inicializar - carregar dados salvos
  carregarDados();

  const organizacoesPoliciais = [
    "1º BPM - Batalhão de Porto Velho",
    "2º BPM - Batalhão de Ji-Paraná",
    "3º BPM - Batalhão de Ariquemes",
    "4º BPM - Batalhão de Cacoal",
    "5º BPM - Batalhão de Vilhena",
    "BOPE - Batalhão de Operações Policiais Especiais",
    "BPTRAN - Batalhão de Policiamento de Trânsito",
    "BPRP - Batalhão de Policiamento Rural",
  ];

  const municipios = [
    "Porto Velho",
    "Ji-Paraná",
    "Ariquemes",
    "Cacoal",
    "Vilhena",
    "Rolim de Moura",
    "Jaru",
    "Lucas do Rio Verde",
    "Sinop",
    "Alta Floresta",
    "Alvorada do Oeste",
    "Presidente Medici",
    "Ouro Preto do Oeste",
    "Buritis",
    "Machado",
    "Pimenta Bueno",
    "Espigão do Oeste",
    "São Miguel do Guaporé",
  ];

  const empregosPoliciciamento = [
    "APOIO POLICIAL",
    "OPERAÇÃO POLICIAL",
    "POLICIAMENTO OSTENSIVO",
    "POLICIAMENTO DE TRÂNSITO",
    "POLICIAMENTO RURAL",
    "OPERAÇÃO INTEGRADA",
    "FORÇA NACIONAL",
  ];

  const areas = ["URBANA", "RURAL", "ÁREA DE FRONTEIRA", "ZONA METROPOLITANA"];

  const orgaosDemandantes = [
    "DETRAN - Departamento de Trânsito",
    "PMRO - Polícia Militar de Rondônia",
    "DERSO PMRO - Diretoria de Estatísticas",
    "Secretaria de Segurança Pública",
    "Governo do Estado",
    "Ministério Público",
    "Polícia Federal",
    "Polícia Civil",
  ];

  const indicadores = computed<Indicadores>(() => {
    const ops = operacoesReais.value;
    const totalOrcado = ops.reduce((sum, op) => sum + (op.recursoFinanceiroEmpregado ?? 0), 0);
    const totalGasto = ops.reduce((sum, op) => sum + (op.valorGasto ?? 0), 0);
    const totalDias = ops.reduce((sum, op) => sum + (op.totalDias ?? 0), 0);
    const totalEfetivo = ops.reduce((sum, op) => sum + (op.qtdeEfetivo ?? 0), 0);
    const totalViaturas = ops.reduce((sum, op) => sum + (op.qtdeViaturas ?? 0), 0);

    return {
      custoPorDia: totalDias > 0 ? totalGasto / totalDias : 0,
      custoPorEfetivo: totalEfetivo > 0 ? totalGasto / totalEfetivo : 0,
      custoPorViatura: totalViaturas > 0 ? totalGasto / totalViaturas : 0,
      percentualExecucao: totalOrcado > 0 ? (totalGasto / totalOrcado) * 100 : 0,
      saldoRestante: totalOrcado - totalGasto,
      totalGasto,
      totalOrcado,
      valorPorDiaTotal: totalDias > 0 ? totalOrcado / totalDias : 0,
      efetivoPorDiaTotal: totalDias > 0 ? totalEfetivo / totalDias : 0,
      valorPorPessoaTotal: totalEfetivo > 0 ? totalOrcado / totalEfetivo : 0,
    };
  });

  // Calcular indicadores de uma operação específica
  function calcularIndicadoresOperacao(op: Operacao): IndicadoresOperacao {
    const dias = op.totalDias > 0 ? op.totalDias : 1;
    const efetivo = op.qtdeEfetivo > 0 ? op.qtdeEfetivo : 1;

    return {
      valorPorDia: op.recursoFinanceiroEmpregado / dias,
      efetivoPorDia: op.qtdeEfetivo / dias,
      valorPorPessoa: op.recursoFinanceiroEmpregado / efetivo,
      valorPorPessoaPorDia: op.recursoFinanceiroEmpregado / (efetivo * dias),
    };
  }

  const operacoesPorStatus = computed(() => ({
    rascunho: operacoes.value.filter((o) => o.status === "rascunho").length,
    pendente: operacoes.value.filter((o) => o.status === "pendente").length,
    aprovado: operacoes.value.filter((o) => o.status === "aprovado").length,
    rejeitado: operacoes.value.filter((o) => o.status === "rejeitado").length,
  }));

  const indicadoresGerais = computed(() => {
    const ops = operacoesReais.value;
    return {
      totalOperacoes: ops.length,
      totalOrcamento: ops.reduce((sum, op) => sum + (op.recursoFinanceiroEmpregado ?? 0), 0),
      totalEfetivo: ops.reduce((sum, op) => sum + (op.qtdeEfetivo ?? 0), 0),
      totalViaturas: ops.reduce((sum, op) => sum + (op.qtdeViaturas ?? 0), 0),
      totalDias: ops.reduce((sum, op) => sum + (op.totalDias ?? 0), 0),
      totalMunicipios: new Set(ops.map((o) => o.municipio)).size,
      totalOrgoes: new Set(ops.map((o) => o.orgaoDemandante)).size,
      totalUrbana: ops.filter((o) => o.area?.toUpperCase().includes("URBANA")).length,
      totalRural: ops.filter((o) => o.area?.toUpperCase().includes("RURAL")).length,
    };
  });

  function gerarId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  function adicionarAuditoria(
    operacaoId: string,
    acao: Auditoria["acao"],
    dadosAnteriores: Record<string, unknown> | null,
    dadosNovos: Record<string, unknown> | null,
  ) {
    auditoria.value.push({
      id: gerarId(),
      operacaoId,
      usuarioId: usuarioAtual.value?.id || "sistema",
      acao,
      dadosAnteriores,
      dadosNovos,
      ip: "127.0.0.1",
      timestamp: new Date().toISOString(),
    });
  }

  function criarOperacao(
    dados: Omit<Operacao, "id" | "status" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">,
  ): Operacao {
    const now = new Date().toISOString();
    const novaOperacao: Operacao = {
      ...dados,
      id: gerarId(),
      status: "rascunho",
      createdAt: now,
      updatedAt: now,
      createdBy: usuarioAtual.value?.id || "sistema",
      updatedBy: usuarioAtual.value?.id || "sistema",
    };
    operacoes.value.push(novaOperacao);
    adicionarAuditoria(novaOperacao.id, "criar", null, dados as unknown as Record<string, unknown>);
    salvarDados();
    sincronizarGoogleSheets();
    return novaOperacao;
  }

  function atualizarOperacao(id: string, dados: Partial<Operacao>): Operacao | null {
    const index = operacoes.value.findIndex((o) => o.id === id);
    if (index === -1) return null;

    const anterior = { ...operacoes.value[index] };
    const atualizada = {
      ...anterior,
      ...dados,
      id: anterior.id,
      diaInicio: dados.diaInicio ?? anterior.diaInicio,
      totalDias: dados.totalDias ?? anterior.totalDias,
      organizacaoPolicialMilitar:
        dados.organizacaoPolicialMilitar ?? anterior.organizacaoPolicialMilitar,
      municipio: dados.municipio ?? anterior.municipio,
      empregoPoliciciamento: dados.empregoPoliciciamento ?? anterior.empregoPoliciciamento,
      nomeOperacaoApoio: dados.nomeOperacaoApoio ?? anterior.nomeOperacaoApoio,
      area: dados.area ?? anterior.area,
      orgaoDemandante: dados.orgaoDemandante ?? anterior.orgaoDemandante,
      numeroSei: dados.numeroSei ?? anterior.numeroSei,
      qtdeEfetivo: dados.qtdeEfetivo !== undefined ? dados.qtdeEfetivo : anterior.qtdeEfetivo,
      qtdeViaturas: dados.qtdeViaturas !== undefined ? dados.qtdeViaturas : anterior.qtdeViaturas,
      recursoFinanceiroEmpregado:
        dados.recursoFinanceiroEmpregado !== undefined
          ? dados.recursoFinanceiroEmpregado
          : anterior.recursoFinanceiroEmpregado,
      valorGasto: dados.valorGasto !== undefined ? dados.valorGasto : anterior.valorGasto,
      codOperacaoSiseg: dados.codOperacaoSiseg ?? anterior.codOperacaoSiseg,
      comandoRegional: dados.comandoRegional ?? anterior.comandoRegional,
      crp: dados.crp ?? anterior.crp,
      tipoRecurso: dados.tipoRecurso ?? anterior.tipoRecurso,
      status: dados.status ?? anterior.status,
      createdAt: anterior.createdAt,
      updatedAt: new Date().toISOString(),
      createdBy: anterior.createdBy,
      updatedBy: usuarioAtual.value?.id ?? "sistema",
    } as Operacao;
    operacoes.value[index] = atualizada;
    adicionarAuditoria(
      id,
      "editar",
      anterior as unknown as Record<string, unknown>,
      dados as unknown as Record<string, unknown>,
    );
    salvarDados();
    sincronizarGoogleSheets();
    return atualizada;
  }

  function excluirOperacao(id: string): boolean {
    const index = operacoes.value.findIndex((o) => o.id === id);
    if (index === -1) return false;

    const anterior = { ...operacoes.value[index] };
    operacoes.value.splice(index, 1);
    adicionarAuditoria(id, "excluir", anterior as unknown as Record<string, unknown>, null);
    salvarDados();
    sincronizarGoogleSheets();
    return true;
  }

  function submeterAprovacao(id: string): Operacao | null {
    return atualizarOperacao(id, { status: "pendente" });
  }

  function aprovarOperacao(id: string): Operacao | null {
    const op = atualizarOperacao(id, { status: "aprovado" });
    if (op) adicionarAuditoria(id, "aprovar", null, null);
    return op;
  }

  function rejeitarOperacao(id: string): Operacao | null {
    const op = atualizarOperacao(id, { status: "rejeitado" });
    if (op) adicionarAuditoria(id, "rejeitar", null, null);
    return op;
  }

  // Mapeamento de usuários válidos
  const usuariosValidos: Record<string, { senha: string; perfil: PerfilUsuario; nome: string }> = {
    "admin@cpo.com.br": { senha: "admin123456", perfil: "admin", nome: "Administrador CPO" },
    "crp1@cpo.com.br": { senha: "@crp1admin", perfil: "gestor_operacional", nome: "CRP 1" },
    "crp2@cpo.com.br": { senha: "crp2@admin", perfil: "gestor_operacional", nome: "CRP 2" },
    "crp3@cpo.com.br": { senha: "#crp3admin", perfil: "gestor_operacional", nome: "CRP 3" },
    "crp4@cpo.com.br": { senha: "crp4#admin", perfil: "gestor_operacional", nome: "CRP 4" },
    "cpe@cpo.com.br": { senha: "cpeadmin@", perfil: "admin", nome: "CPE" },
  };

  function login(email: string, senha: string): { sucesso: boolean; erro?: string } {
    const usuario = usuariosValidos[email];

    if (!usuario) {
      return { sucesso: false, erro: "Usuário não encontrado" };
    }

    if (usuario.senha !== senha) {
      return { sucesso: false, erro: "Senha incorreta" };
    }

    usuarioAtual.value = {
      id: gerarId(),
      nome: usuario.nome,
      email: email,
      perfil: usuario.perfil,
      organizacaoPolicialMilitar: "PMRO",
      ativo: true,
      createdAt: new Date().toISOString(),
    };

    return { sucesso: true };
  }

  function loginPorPerfil(perfil: PerfilUsuario) {
    usuarioAtual.value = {
      id: gerarId(),
      nome: getNomePorPerfil(perfil),
      email: `${perfil}@pm.ro.gov.br`,
      perfil,
      organizacaoPolicialMilitar: "PMRO",
      ativo: true,
      createdAt: new Date().toISOString(),
    };
  }

  function logout() {
    usuarioAtual.value = null;
  }

  function getNomePorPerfil(perfil: string): string {
    const nomes: Record<string, string> = {
      admin: "Administrador do Sistema",
      gestor_operacional: "Gestor Operacional",
      auditor: "Auditor Interno",
      operacional: "Operacional",
    };
    return nomes[perfil] || "Usuário";
  }

  function temPermissao(perfilNecessario: PerfilUsuario): boolean {
    if (!usuarioAtual.value) return false;
    const permissoes: Record<PerfilUsuario, PerfilUsuario[]> = {
      admin: ["admin", "gestor_operacional", "auditor", "operacional"],
      gestor_operacional: ["gestor_operacional", "operacional"],
      auditor: ["auditor"],
      operacional: ["operacional"],
    };
    return permissoes[usuarioAtual.value.perfil]?.includes(perfilNecessario) ?? false;
  }

  function importarDados(
    dadosJson: string,
    limparPrimeiro: boolean = false,
  ): { sucesso: number; erros: number } {
    try {
      if (limparPrimeiro) {
        operacoes.value = [];
      }

      // Limpar o texto - remover texto antes e depois do JSON
      let jsonString = dadosJson.trim();

      // Encontrar o início do array JSON
      const startIndex = jsonString.indexOf("[");
      let endIndex = jsonString.lastIndexOf("]");

      if (startIndex === -1 || endIndex === -1) {
        return { sucesso: 0, erros: 1 };
      }

      // Verificar se há texto depois do ] final (como vírgulas ou newlines)
      jsonString = jsonString.substring(startIndex, endIndex + 1);

      // Remover vírgulas extras antes de ]
      jsonString = jsonString.replace(/,\s*\]/g, "]");

      const dados = JSON.parse(jsonString);
      let sucesso = 0;
      let erros = 0;

      const arrayDados = Array.isArray(dados) ? dados : [dados];

      arrayDados.forEach((item: Record<string, unknown>) => {
        try {
          const operacao = converterParaOperacao(item);
          if (operacao) {
            operacoes.value.push(operacao);
            sucesso++;
          } else {
            erros++;
          }
        } catch {
          erros++;
        }
      });

      salvarDados();
      return { sucesso, erros };
    } catch (e) {
      console.error("Erro ao importar:", e);
      return { sucesso: 0, erros: 1 };
    }
  }

  function converterParaOperacao(dados: Record<string, unknown>): Operacao | null {
    const now = new Date().toISOString();

    const normalize = (text: string) =>
      text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    const getVal = (possibleKeys: string[], defaultValue: any = "") => {
      const keys = possibleKeys.map(normalize);
      for (const [key, value] of Object.entries(dados)) {
        if (keys.includes(normalize(key))) {
          return value;
        }
      }
      return defaultValue;
    };

    const limparValor = (valor: unknown): number => {
      if (typeof valor === "number") return valor;
      if (typeof valor === "string") {
        const limpo = valor.replace(/[R$\s.]/g, "").replace(",", ".");
        return Number(limpo) || 0;
      }
      return 0;
    };

    const extrairData = (valor: unknown): string => {
      if (!valor) return "";
      if (valor instanceof Date) {
        return valor.toISOString().split("T")[0] ?? "";
      }
      const str = String(valor);
      if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        return str.split("T")[0] ?? str;
      }
      if (str.includes("T")) {
        return str.split("T")[0] ?? str;
      }
      return str;
    };

    const diaInicio = formatarData(extrairData(getVal(["diaInicio", "DATA DE INÍCIO", "dia de início"])));
    const nomeOperacao = String(
      getVal(["nomeOperacaoApoio", "NOME DA OPERAÇÃO/APOIO", "operação", "nome"]),
    );

    if (!diaInicio && !nomeOperacao) {
      return null;
    }

    return {
      id: String(getVal(["id", "ID"]) || gerarId()),
      diaInicio,
      totalDias: Number(getVal(["totalDias", "TOTAL DE DIAS"], 1)),
      organizacaoPolicialMilitar: String(
        getVal(["organizacaoPolicialMilitar", "ORGANIZAÇÃO POLICIAL MILITAR", "BPM"]),
      ),
      municipio: String(getVal(["municipio", "MUNICÍPIO", "MUNICÍPIO/DISTRITO"])),
      empregoPoliciciamento: String(
        getVal(["empregoPoliciciamento", "EMPREGO DE POLICIAMENTO", "emprego"]),
      ),
      nomeOperacaoApoio: nomeOperacao,
      area: String(getVal(["area", "ÁREA"])),
      orgaoDemandante: String(getVal(["orgaoDemandante", "ÓRGÃO DEMANDANTE", "demandante"])),
      numeroSei: String(getVal(["numeroSei", "Nº SEI", "SEI"])),
      qtdeEfetivo: Number(getVal(["qtdeEfetivo", "QTDE EFETIVO"], 0)),
      qtdeViaturas: Number(getVal(["qtdeViaturas", "QTDE VIATURAS"], 0)),
      recursoFinanceiroEmpregado: limparValor(
        getVal(["recursoFinanceiroEmpregado", "RECURSO EMPREGADO", "RECURSO FINANCEIRO EMPREGADO"]),
      ),
      valorGasto: limparValor(getVal(["valorGasto", "VALOR GASTO", "VALOR_GASTO"])),
      codOperacaoSiseg: String(getVal(["codOperacaoSiseg", "CÓD. OPERAÇÃO SISEG"])),
      comandoRegional: String(getVal(["comandoRegional", "COMANDO REGIONAL"])),
      crp: String(getVal(["crp", "CRP"])),
      origem: getVal(["origem"]) as any,
      tipoRecurso: String(getVal(["tipoRecurso", "TIPO FINANCEIRO EMPREGADO"])),
      status: getVal(["status", "STATUS"], "rascunho") as Operacao["status"],
      createdAt: String(getVal(["createdAt", "CRIADO EM"], now)),
      updatedAt: String(getVal(["updatedAt", "ATUALIZADO EM"], now)),
      createdBy: String(getVal(["createdBy", "CRIADO POR"], "importacao")),
      updatedBy: String(getVal(["updatedBy", "ATUALIZADO POR"], "importacao")),
    };
  }

  function formatarData(data: string): string {
    if (!data) return "";

    // Se já está no formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return data;
    }

    // Tentar converter DD/MM/YYYY
    const parts = data.split(/[\/\-.]/);
    if (parts.length === 3) {
      const p0 = String(parts[0] || "");
      const p1 = String(parts[1] || "");
      const p2 = String(parts[2] || "");

      if (p0.length === 4) {
        // YYYY-MM-DD
        return `${p0}-${p1.padStart(2, "0")}-${p2.padStart(2, "0")}`;
      } else if (p2.length === 4) {
        // DD/MM/YYYY -> YYYY-MM-DD
        return `${p2}-${p1.padStart(2, "0")}-${p0.padStart(2, "0")}`;
      }
    }

    return data;
  }

  function limparDados() {
    operacoes.value = [];
    auditoria.value = [];
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AUDITORIA_KEY);
  }

  return {
    operacoes,
    usuarioAtual,
    auditoria,
    loading,
    erro,
    modoOffline,
    organizacoesPoliciais,
    municipios,
    empregosPoliciciamento,
    areas,
    orgaosDemandantes,
    indicadores,
    indicadoresGerais,
    operacoesReais,
    operacoesPorStatus,
    calcularIndicadoresOperacao,
    criarOperacao,
    atualizarOperacao,
    excluirOperacao,
    submeterAprovacao,
    aprovarOperacao,
    rejeitarOperacao,
    login,
    logout,
    temPermissao,
    importarDados,
    limparDados,
  };
});
