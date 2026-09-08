<script setup lang="ts">
import { ref, computed } from "vue";
import { useOperacaoStore } from "@/stores/operacao";

const store = useOperacaoStore();

const ANO_RELATORIO = '2026';
const anoCorrente = new Date().getFullYear().toString();
const periodoInicio = ref(`${anoCorrente}-01-01`);

const periodoFim = ref(`${anoCorrente}-12-31`);
const organizacaoSelecionada = ref("");
const filtroCRP = ref("");
const filtroPoliciamento = ref("");
const filtroTipoRecurso = ref("");
const filtroArea = ref("");
const filtroMunicipio = ref("");
const filtroOrgao = ref("");
const buscaTexto = ref("");

const dataMinimaLancamento = computed(() => {
  if (!store.operacoesReais.length) return "";
  const datas = store.operacoesReais
    .map((op) => op.diaInicio)
    .filter(Boolean)
    .sort();
  return datas[0] || "";
});

// Unique values for filter dropdowns
const crpsUnicos = computed(() => [
  ...new Set(store.operacoesReais.map((o) => (o.comandoRegional || o.crp)?.trim()).filter(Boolean)),
]);
const organizacoesUnicas = computed(() => [
  ...new Set(store.operacoesReais.map((o) => o.organizacaoPolicialMilitar).filter((o) => o)),
]);
const policiamentosUnicos = computed(() => [
  ...new Set(store.operacoesReais.map((o) => o.empregoPoliciciamento).filter(Boolean)),
]);
const tiposRecursoUnicos = computed(() => [
  ...new Set(store.operacoesReais.map((o) => o.tipoRecurso).filter(Boolean)),
]);
const areasUnicas = computed(() => [
  ...new Set(store.operacoesReais.map((o) => o.area).filter(Boolean)),
]);
const municipiosUnicos = computed(() =>
  [...new Set(store.operacoesReais.map((o) => o.municipio).filter(Boolean))].sort(),
);
const orgaosUnicos = computed(() =>
  [...new Set(store.operacoesReais.map((o) => o.orgaoDemandante).filter(Boolean))].sort(),
);

const operacoesFiltradas = computed(() => {
  return store.operacoesReais.filter((op) => {
    const matchesOrg =
      !organizacaoSelecionada.value ||
      (op.organizacaoPolicialMilitar &&
        op.organizacaoPolicialMilitar
          .toLowerCase()
          .includes(organizacaoSelecionada.value.toLowerCase()));
    const matchesInicio = !periodoInicio.value || op.diaInicio >= periodoInicio.value;
    const matchesFim = !periodoFim.value || op.diaInicio <= periodoFim.value;
    const matchesCRP =
      !filtroCRP.value ||
      (op.comandoRegional && op.comandoRegional.toLowerCase().trim() === filtroCRP.value.toLowerCase().trim()) ||
      (op.crp && op.crp.toLowerCase().trim() === filtroCRP.value.toLowerCase().trim());
    const matchesPol =
      !filtroPoliciamento.value || op.empregoPoliciciamento === filtroPoliciamento.value;
    const matchesTipo = !filtroTipoRecurso.value || op.tipoRecurso === filtroTipoRecurso.value;
    const matchesArea = !filtroArea.value || op.area === filtroArea.value;
    const matchesMun = !filtroMunicipio.value || op.municipio === filtroMunicipio.value;
    const matchesOrgao = !filtroOrgao.value || op.orgaoDemandante === filtroOrgao.value;
    const matchesBusca =
      !buscaTexto.value ||
      (op.nomeOperacaoApoio &&
        op.nomeOperacaoApoio.toLowerCase().includes(buscaTexto.value.toLowerCase())) ||
      (op.numeroSei && op.numeroSei.toLowerCase().includes(buscaTexto.value.toLowerCase())) ||
      (op.codOperacaoSiseg &&
        op.codOperacaoSiseg.toLowerCase().includes(buscaTexto.value.toLowerCase()));
    return (
      matchesOrg &&
      matchesInicio &&
      matchesFim &&
      matchesCRP &&
      matchesPol &&
      matchesTipo &&
      matchesArea &&
      matchesMun &&
      matchesOrgao &&
      matchesBusca
    );
  });
});

// KPIs
const totalRecurso = computed(() =>
  operacoesFiltradas.value.reduce((s, o) => s + o.recursoFinanceiroEmpregado, 0),
);
const totalGasto = computed(() => operacoesFiltradas.value.reduce((s, o) => s + o.valorGasto, 0));
const totalEfetivo = computed(() =>
  operacoesFiltradas.value.reduce((s, o) => s + o.qtdeEfetivo, 0),
);
const totalViaturas = computed(() =>
  operacoesFiltradas.value.reduce((s, o) => s + o.qtdeViaturas, 0),
);
const totalDias = computed(() => operacoesFiltradas.value.reduce((s, o) => s + o.totalDias, 0));
const totalOperacoes = computed(() => operacoesFiltradas.value.length);
const totalMunicipios = computed(
  () => new Set(operacoesFiltradas.value.map((o) => o.municipio).filter(Boolean)).size,
);
const totalOrgaos = computed(
  () => new Set(operacoesFiltradas.value.map((o) => o.orgaoDemandante).filter(Boolean)).size,
);

const custoPorDia = computed(() =>
  totalDias.value > 0 ? totalRecurso.value / totalDias.value : 0,
);
const custoPorEfetivo = computed(() =>
  totalEfetivo.value > 0 ? totalRecurso.value / totalEfetivo.value : 0,
);
const taxaExecucao = computed(() =>
  totalRecurso.value > 0 ? (totalGasto.value / totalRecurso.value) * 100 : 0,
);

// Agrupamentos
const porMunicipio = computed(() => {
  const g: Record<
    string,
    { count: number; recurso: number; gasto: number; efetivo: number; viaturas: number }
  > = {};
  operacoesFiltradas.value.forEach((op) => {
    const k = op.municipio || "Não informado";
    if (!g[k]) g[k] = { count: 0, recurso: 0, gasto: 0, efetivo: 0, viaturas: 0 };
    g[k].count++;
    g[k].recurso += op.recursoFinanceiroEmpregado;
    g[k].gasto += op.valorGasto;
    g[k].efetivo += op.qtdeEfetivo;
    g[k].viaturas += op.qtdeViaturas;
  });
  return Object.entries(g)
    .map(([municipio, d]) => ({ municipio, ...d }))
    .sort((a, b) => b.recurso - a.recurso);
});

const porTipo = computed(() => {
  const g: Record<string, { count: number; recurso: number; efetivo: number }> = {};
  operacoesFiltradas.value.forEach((op) => {
    const k = op.empregoPoliciciamento || "Não informado";
    if (!g[k]) g[k] = { count: 0, recurso: 0, efetivo: 0 };
    g[k].count++;
    g[k].recurso += op.recursoFinanceiroEmpregado;
    g[k].efetivo += op.qtdeEfetivo;
  });
  return Object.entries(g)
    .map(([tipo, d]) => ({ tipo, ...d }))
    .sort((a, b) => b.recurso - a.recurso);
});

const porTipoPorCRP = computed(() => {
  const g: Record<string, { count: number; recurso: number; efetivo: number; crp: string }> = {};
  operacoesFiltradas.value.forEach((op) => {
    const crp = op.comandoRegional || op.crp || "Não informado";
    if (!g[crp]) g[crp] = { count: 0, recurso: 0, efetivo: 0, crp };
    g[crp].count++;
    g[crp].recurso += op.recursoFinanceiroEmpregado;
    g[crp].efetivo += op.qtdeEfetivo;
  });
  return Object.entries(g)
    .map(([key, d]) => ({ crp: key, count: d.count, recurso: d.recurso, efetivo: d.efetivo }))
    .sort((a, b) => b.recurso - a.recurso);
});

const porOrganizacao = computed(() => {
  const g: Record<string, { count: number; recurso: number; efetivo: number }> = {};
  operacoesFiltradas.value.forEach((op) => {
    const k = op.organizacaoPolicialMilitar || "Não informado";
    if (!g[k]) g[k] = { count: 0, recurso: 0, efetivo: 0 };
    g[k].count++;
    g[k].recurso += op.recursoFinanceiroEmpregado;
    g[k].efetivo += op.qtdeEfetivo;
  });
  return Object.entries(g)
    .map(([org, d]) => ({ org, ...d }))
    .sort((a, b) => b.count - a.count);
});

const porArea = computed(() => {
  const g: Record<string, { count: number; recurso: number }> = {};
  operacoesFiltradas.value.forEach((op) => {
    const k = op.area || "Não informado";
    if (!g[k]) g[k] = { count: 0, recurso: 0 };
    g[k].count++;
    g[k].recurso += op.recursoFinanceiroEmpregado;
  });
  return Object.entries(g)
    .map(([area, d]) => ({ area, ...d }))
    .sort((a, b) => b.count - a.count);
});

const parseData = (dataStr: string | undefined | null): Date | null => {
  if (!dataStr || typeof dataStr !== 'string') return null
  const trimmed = dataStr.trim()
  if (!trimmed) return null
  
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/')
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number)
      if (day && month && year) {
        return new Date(year, month - 1, day)
      }
    }
  }
  
  const d = new Date(trimmed)
  return isNaN(d.getTime()) ? null : d
}

const porMes = computed(() => {
  const mesesNomes: string[] = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  const g: Record<string, number> = {};
  operacoesFiltradas.value
    .filter((op) => op.diaInicio && op.diaInicio.startsWith(ANO_RELATORIO))
    .forEach((op) => {
      const dia = op.diaInicio;
      if (!dia) return;
      const parts = dia.split(/[\/\-]/);
      let month = 0;
      if (parts.length === 3 && parts[0] && parts[1]) {
        if (parts[0].length === 4) {
          month = parseInt(parts[1], 10);
        } else {
          month = parseInt(parts[0], 10);
        }
      }
      if (!month) return;
      const m = mesesNomes[month - 1];
      if (!m) return;
      g[m] = (g[m] || 0) + 1;
    });
  return mesesNomes.map((m) => ({ mes: m, total: g[m] || 0 }));
});
const maxPorMes = computed(() => Math.max(...porMes.value.map((m) => m.total), 1));
const maxPorOrg = computed(() => Math.max(...porOrganizacao.value.map((o) => o.count), 1));

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");
const pct = (v: number, t: number) => (t > 0 ? Math.min((v / t) * 100, 100) : 0);

const gerarCSV = () => {
  const headers = [
    "Data Início",
    "Total Dias",
    "Organização Policial",
    "Município",
    "Emprego",
    "Nome Operação",
    "Área",
    "Órgão Demandante",
    "Nº SEI",
    "Qtde Efetivo",
    "Qtde Viaturas",
    "Recurso Financeiro",
    "Valor Gasto",
    "Código SISEG",
    "CRP",
    "Status",
  ];
  const rows = operacoesFiltradas.value.map((op) => [
    op.diaInicio,
    op.totalDias,
    op.organizacaoPolicialMilitar,
    op.municipio,
    op.empregoPoliciciamento,
    op.nomeOperacaoApoio,
    op.area,
    op.orgaoDemandante,
    op.numeroSei,
    op.qtdeEfetivo,
    op.qtdeViaturas,
    op.recursoFinanceiroEmpregado,
    op.valorGasto,
    op.codOperacaoSiseg,
    op.comandoRegional || op.crp,
    op.status,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `relatorio_operacoes_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const imprimir = () => window.print();
</script>

<template>
  <div class="space-y-6 print:space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between print:hidden">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Relatórios</h1>
        <p class="text-gray-500">Relatórios gerenciais e operacionais</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="imprimir"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Imprimir
        </button>
        <button
          @click="gerarCSV"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e3a5f] hover:bg-[#0f2442] text-white text-sm font-medium transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Exportar CSV
        </button>
      </div>
    </div>

    <!-- Print header -->
    <div class="hidden print:block mb-6">
      <div class="flex items-center justify-between border-b-2 border-[#1e3a5f] pb-3 mb-4">
        <div>
          <h1 class="text-2xl font-bold text-[#1e3a5f]">Relatório de Operações Policiais</h1>
          <p class="text-sm text-gray-500 mt-0.5">Polícia Militar do Estado de Rondônia — CPO</p>
        </div>
        <div class="text-right text-xs text-gray-500">
          <p>Gerado em {{ new Date().toLocaleString("pt-BR") }}</p>
          <p v-if="periodoInicio || periodoFim">
            Período:
            {{ periodoInicio ? new Date(periodoInicio).toLocaleDateString("pt-BR") : "início" }} até
            {{ periodoFim ? new Date(periodoFim).toLocaleDateString("pt-BR") : "hoje" }}
          </p>
          <p v-if="organizacaoSelecionada">Organização: {{ organizacaoSelecionada }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card p-4 print:hidden">
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div class="lg:col-span-2">
          <label class="block text-xs font-medium text-gray-700 mb-1">Buscar</label>
          <div class="relative">
            <input
              v-model="buscaTexto"
              type="text"
              placeholder="Nome, SEI ou Código SISEG..."
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] pl-9"
            />
            <svg
              class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Período Início</label>
          <input
            v-model="periodoInicio"
            type="date"
            :min="dataMinimaLancamento"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Período Fim</label>
          <input
            v-model="periodoFim"
            type="date"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">BPM</label>
          <select
            v-model="organizacaoSelecionada"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          >
            <option value="">Todos</option>
            <option v-for="op in organizacoesUnicas" :key="op" :value="op">{{ op }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">CRP</label>
          <select
            v-model="filtroCRP"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          >
            <option value="">Todos</option>
            <option v-for="c in crpsUnicos" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Policiamento Empregado</label>
          <select
            v-model="filtroPoliciamento"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          >
            <option value="">Todos</option>
            <option v-for="p in policiamentosUnicos" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Tipo de Recurso</label>
          <select
            v-model="filtroTipoRecurso"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          >
            <option value="">Todos</option>
            <option v-for="t in tiposRecursoUnicos" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Área</label>
          <select
            v-model="filtroArea"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          >
            <option value="">Todas</option>
            <option v-for="a in areasUnicas" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Município/Distrito</label>
          <select
            v-model="filtroMunicipio"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          >
            <option value="">Todos</option>
            <option v-for="m in municipiosUnicos" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Órgão Demandante</label>
          <select
            v-model="filtroOrgao"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          >
            <option value="">Todos</option>
            <option v-for="o in orgaosUnicos" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="flex items-end">
          <button
            @click="
              periodoInicio = anoCorrente + '-01-01';
              periodoFim = '';
              organizacaoSelecionada = '';
              filtroCRP = '';
              filtroPoliciamento = '';
              filtroTipoRecurso = '';
              filtroArea = '';
              filtroMunicipio = '';
              filtroOrgao = '';
            "
            class="w-full border border-gray-300 text-gray-600 text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      </div>
    </div>

    <!-- KPI Row 1: Financial -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card p-5 flex items-center gap-4">
        <div
          class="w-11 h-11 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center flex-shrink-0"
        >
          <svg class="w-5 h-5 text-[#1e3a5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div class="min-w-0">
          <p class="text-xs text-gray-500 uppercase tracking-wide truncate">
            Recurso Financeiro Empregado
          </p>
          <p class="text-xl font-bold text-gray-900 truncate">{{ formatCurrency(totalRecurso) }}</p>
        </div>
      </div>

      <div class="card p-5 flex items-center gap-4">
        <div class="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div class="min-w-0">
          <p class="text-xs text-gray-500 uppercase tracking-wide truncate">Custo Médio por Dia</p>
          <p class="text-xl font-bold text-gray-900 truncate">{{ formatCurrency(custoPorDia) }}</p>
          <p class="text-xs text-gray-400 mt-0.5">Recurso ÷ Total de Dias</p>
        </div>
      </div>

      <div class="card p-5 flex items-center gap-4">
        <div
          class="w-11 h-11 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0"
        >
          <svg
            class="w-5 h-5 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <div class="min-w-0">
          <p class="text-xs text-gray-500 uppercase tracking-wide truncate">
            Custo Médio por Policial
          </p>
          <p class="text-xl font-bold text-gray-900 truncate">
            {{ formatCurrency(custoPorEfetivo) }}
          </p>
          <p class="text-xs text-gray-400 mt-0.5">Recurso ÷ Efetivo</p>
        </div>
      </div>
    </div>

    <!-- KPI Row 2: Operational -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div class="card p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Total de Operações</p>
        <p class="text-2xl font-bold text-[#1e3a5f]">{{ totalOperacoes }}</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Total de Policiais</p>
        <p class="text-2xl font-bold text-[#1e3a5f]">{{ totalEfetivo.toLocaleString("pt-BR") }}</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Total de Viaturas</p>
        <p class="text-2xl font-bold text-[#1e3a5f]">{{ totalViaturas.toLocaleString("pt-BR") }}</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Total de Dias</p>
        <p class="text-2xl font-bold text-[#1e3a5f]">{{ totalDias.toLocaleString("pt-BR") }}</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Municípios/Distritos</p>
        <p class="text-2xl font-bold text-[#1e3a5f]">{{ totalMunicipios }}</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Órgãos Demandantes</p>
        <p class="text-2xl font-bold text-[#1e3a5f]">{{ totalOrgaos }}</p>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Operações por Mês -->
      <div class="card p-6">
        <h2 class="text-base font-semibold text-gray-800 mb-4">Operações por Mês</h2>
        <div class="flex items-end justify-between h-36 gap-1">
          <div v-for="item in porMes" :key="item.mes" class="flex flex-col items-center flex-1">
            <span class="text-xs text-gray-400 mb-0.5">{{ item.total > 0 ? item.total : "" }}</span>
            <div
              class="w-full bg-[#1e3a5f] rounded-t transition-all duration-300"
              :style="{
                height: `${(item.total / maxPorMes) * 110}px`,
                minHeight: item.total > 0 ? '4px' : '0',
              }"
            ></div>
            <span class="text-xs text-gray-500 mt-1">{{ item.mes }}</span>
          </div>
        </div>
      </div>

      <!-- Operações por Área -->
      <div class="card p-6">
        <h2 class="text-base font-semibold text-gray-800 mb-4">Operações por Área</h2>
        <div class="space-y-3">
          <div v-for="item in porArea" :key="item.area" class="flex items-center gap-3">
            <span class="text-xs text-gray-600 w-36 truncate font-medium" :title="item.area">{{
              item.area
            }}</span>
            <div class="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-[#1e3a5f] rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                :style="{
                  width: `${pct(item.count, totalOperacoes)}%`,
                  minWidth: item.count > 0 ? '24px' : '0',
                }"
              >
                <span class="text-xs text-white font-semibold">{{ item.count }}</span>
              </div>
            </div>
            <span class="text-xs text-gray-500 w-12 text-right"
              >{{ pct(item.count, totalOperacoes).toFixed(0) }}%</span
            >
          </div>
          <p v-if="!porArea.length" class="text-sm text-gray-400 text-center py-4">Nenhum dado</p>
        </div>
      </div>

      <!-- Operações por Tipo de Policiamento -->
      <div class="card p-6">
        <h2 class="text-base font-semibold text-gray-800 mb-4">
          Operações por Tipo de Policiamento
        </h2>
        <div class="space-y-3">
          <div v-for="item in porTipo" :key="item.tipo" class="flex items-center gap-3">
            <span class="text-xs text-gray-600 w-36 truncate" :title="item.tipo">{{
              item.tipo
            }}</span>
            <div class="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-[#1e3a5f] rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                :style="{
                  width: `${pct(item.count, totalOperacoes)}%`,
                  minWidth: item.count > 0 ? '24px' : '0',
                }"
              >
                <span class="text-xs text-white font-semibold"
                  >{{ pct(item.count, totalOperacoes).toFixed(0) }}%</span
                >
              </div>
            </div>
            <span class="text-xs text-gray-400 w-28 text-right truncate">{{
              formatCurrency(item.recurso)
            }}</span>
          </div>
          <p v-if="!porTipo.length" class="text-sm text-gray-400 text-center py-4">Nenhum dado</p>
        </div>
      </div>

      <!-- Operações por Organização -->
      <div class="card p-6">
        <h2 class="text-base font-semibold text-gray-800 mb-4">Operações por CRP</h2>
        <div class="space-y-3">
          <div v-for="item in porTipoPorCRP" :key="item.crp" class="flex items-center gap-3">
            <span class="text-xs text-gray-600 w-36 truncate font-medium" :title="item.crp">{{
              item.crp
            }}</span>
            <div class="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-[#1e3a5f] rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                :style="{
                  width: `${pct(item.count, totalOperacoes)}%`,
                  minWidth: item.count > 0 ? '24px' : '0',
                }"
              >
                <span class="text-xs text-white font-semibold">{{ item.count }}</span>
              </div>
            </div>
            <span class="text-xs text-gray-400 w-16 text-right"
              >{{ pct(item.count, totalOperacoes).toFixed(0) }}%</span
            >
          </div>
          <p v-if="!porTipoPorCRP.length" class="text-sm text-gray-400 text-center py-4">
            Nenhum dado
          </p>
        </div>
      </div>
    </div>

    <!-- Tables Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Por Município -->
      <div class="card p-6">
        <h2 class="text-base font-semibold text-gray-800 mb-4">Operações por Município</h2>
        <div class="table-container !border-0 !rounded-none !shadow-none !bg-transparent !overflow-visible">
          <table class="custom-table custom-table-dense">
            <thead>
              <tr>
                <th>Município/Distrito</th>
                <th class="text-center">Operações</th>
                <th class="text-center">Total de Efetivo</th>
                <th class="text-right">Recurso Empregado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in porMunicipio" :key="item.municipio">
                <td class="font-medium text-gray-800">{{ item.municipio }}</td>
                <td class="text-center">
                  <span
                    class="px-2 py-0.5 bg-[#1e3a5f]/10 text-[#1e3a5f] rounded-full text-xs font-semibold"
                    >{{ item.count }}</span
                  >
                </td>
                <td class="text-center text-gray-600">{{ item.efetivo }}</td>
                <td class="text-right text-gray-700 font-medium">
                  {{ formatCurrency(item.recurso) }}
                </td>
              </tr>
              <tr v-if="!porMunicipio.length">
                <td colspan="4" class="py-6 text-center text-gray-400 text-xs">
                  Nenhum dado encontrado
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Operações por BPM -->
      <div class="card p-6">
        <h2 class="text-base font-semibold text-gray-800 mb-4">Operações por BPM</h2>
        <div class="table-container !border-0 !rounded-none !shadow-none !bg-transparent !overflow-visible">
          <table class="custom-table custom-table-dense">
            <thead>
              <tr>
                <th>BPM</th>
                <th class="text-center">Operações</th>
                <th class="text-right">Recurso Empregado</th>
                <th class="text-center">Total de Efetivo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in porOrganizacao" :key="item.org">
                <td class="font-medium text-gray-800">{{ item.org }}</td>
                <td class="text-center">
                  <span
                    class="px-2 py-0.5 bg-[#1e3a5f]/10 text-[#1e3a5f] rounded-full text-xs font-semibold"
                    >{{ item.count }}</span
                  >
                </td>
                <td class="text-right text-gray-700">{{ formatCurrency(item.recurso) }}</td>
                <td class="text-center font-semibold text-gray-700">{{ item.efetivo }}</td>
              </tr>
              <tr v-if="!porOrganizacao.length">
                <td colspan="5" class="py-6 text-center text-gray-400 text-xs">
                  Nenhum dado encontrado
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Detail Table -->
    <div class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold text-gray-800">Detalhamento das Operações</h2>
        <span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full"
          >{{ operacoesFiltradas.length }} registros</span
        >
      </div>
      <div class="table-container">
        <table class="custom-table custom-table-dense">
          <thead>
            <tr>
              <th>Operação</th>
              <th>Município/Distrito</th>
              <th>Data Início</th>
              <th class="text-center">Dias</th>
              <th class="text-center">Efetivo</th>
              <th class="text-center">Viaturas</th>
              <th class="text-right">Recurso</th>
              <th>BPM</th>
              <th>CRP</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="op in operacoesFiltradas" :key="op.id">
              <td class="font-medium text-[#1e3a5f]">
                <router-link :to="`/operacoes/${op.id}`" class="hover:underline">
                  {{ op.nomeOperacaoApoio }}
                </router-link>
              </td>
              <td class="text-gray-600">{{ op.municipio }}</td>
              <td class="text-gray-500 whitespace-nowrap">
                {{ formatDate(op.diaInicio) }}
              </td>
              <td class="text-center text-gray-600">{{ op.totalDias }}</td>
              <td class="text-center text-gray-600">{{ op.qtdeEfetivo }}</td>
              <td class="text-center text-gray-600">{{ op.qtdeViaturas }}</td>
              <td class="text-right text-gray-700 font-medium">
                {{ formatCurrency(op.recursoFinanceiroEmpregado) }}
              </td>
              <td class="text-gray-600 text-xs">
                {{ op.organizacaoPolicialMilitar || "-" }}
              </td>
              <td class="text-gray-600 text-xs">
                {{ op.comandoRegional || op.crp || "-" }}
              </td>
            </tr>
            <tr v-if="!operacoesFiltradas.length">
              <td colspan="9" class="py-6 text-center text-gray-400 text-xs">
                Nenhuma operação encontrada com os filtros selecionados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style>
@media print {
  /* KPI grids: force 4 columns */
  .grid-cols-2 {
    grid-template-columns: repeat(4, 1fr) !important;
  }

  /* Charts: side by side */
  .lg\:grid-cols-2 {
    grid-template-columns: repeat(2, 1fr) !important;
  }

  /* Bar charts: keep colors */
  .bg-\[\#1e3a5f\] {
    background-color: #1e3a5f !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Avoid breaking tables across pages */
  table {
    page-break-inside: auto;
  }
  tr {
    page-break-inside: avoid;
  }
  thead {
    display: table-header-group;
  }

  /* Space between sections */
  .space-y-6 > * + * {
    margin-top: 12pt !important;
  }
}
</style>
