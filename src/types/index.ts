export interface Operacao {
  id: string;
  diaInicio: string;
  totalDias: number;
  organizacaoPolicialMilitar: string;
  municipio: string;
  empregoPoliciciamento: string;
  nomeOperacaoApoio: string;
  area: string;
  orgaoDemandante: string;
  numeroSei: string;
  qtdeEfetivo: number;
  qtdeViaturas: number;
  recursoFinanceiroEmpregado: number;
  valorGasto: number;
  codOperacaoSiseg: string;
  comandoRegional?: string;
  crp?: string;
  tipoRecurso?: string;
  origem?: "operacao";
  status: "rascunho" | "pendente" | "aprovado" | "rejeitado";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface IndicadoresOperacao {
  valorPorDia: number;
  efetivoPorDia: number;
  valorPorPessoa: number;
  valorPorPessoaPorDia: number;
}

export interface Indicadores {
  custoPorDia: number;
  custoPorEfetivo: number;
  custoPorViatura: number;
  percentualExecucao: number;
  saldoRestante: number;
  totalGasto: number;
  totalOrcado: number;
  valorPorDiaTotal: number;
  efetivoPorDiaTotal: number;
  valorPorPessoaTotal: number;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: "admin" | "gestor_operacional" | "auditor" | "operacional";
  organizacaoPolicialMilitar: string;
  ativo: boolean;
  createdAt: string;
}

export interface Auditoria {
  id: string;
  operacaoId: string;
  usuarioId: string;
  acao: "criar" | "editar" | "excluir" | "visualizar" | "aprovar" | "rejeitar";
  dadosAnteriores: Record<string, unknown> | null;
  dadosNovos: Record<string, unknown> | null;
  ip: string;
  timestamp: string;
}

export type PerfilUsuario = "admin" | "gestor_operacional" | "auditor" | "operacional";
