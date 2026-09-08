<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useOperacaoStore } from "@/stores/operacao";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
import { coordenadasMunicipiosRO, encontrarChaveMunicipio } from "@/utils/coordenadas";

const router = useRouter();
const store = useOperacaoStore();

const busca = ref("");
const filtroStatus = ref("");
const filtroMunicipio = ref("");
const filtroOrganizacao = ref("");
const filtroOrgao = ref("");
const filtroCRP = ref("");
const filtroArea = ref("");
const filtroPoliciamento = ref("");
const filtroTipoRecurso = ref("");
const paginaAtual = ref(1);
const itensPorPagina = 20;

watch(
  [
    busca,
    filtroStatus,
    filtroMunicipio,
    filtroOrganizacao,
    filtroOrgao,
    filtroCRP,
    filtroArea,
    filtroPoliciamento,
    filtroTipoRecurso,
  ],
  () => {
    paginaAtual.value = 1;
  },
);

const operacoesFiltradas = computed(() => {
  return store.operacoesReais.filter((op) => {
    const buscaLower = busca.value.toLowerCase();
    const matchesBusca =
      !busca.value ||
      op.nomeOperacaoApoio.toLowerCase().includes(buscaLower) ||
      op.numeroSei.toLowerCase().includes(buscaLower) ||
      op.codOperacaoSiseg.toLowerCase().includes(buscaLower);

    const matchesStatus = !filtroStatus.value || op.status === filtroStatus.value;
    const matchesMunicipio =
      !filtroMunicipio.value ||
      (op.municipio && op.municipio.toLowerCase().includes(filtroMunicipio.value.toLowerCase()));
    const matchesOrganizacao =
      !filtroOrganizacao.value ||
      (op.organizacaoPolicialMilitar &&
        op.organizacaoPolicialMilitar
          .toLowerCase()
          .includes(filtroOrganizacao.value.toLowerCase()));
    const matchesOrgao =
      !filtroOrgao.value ||
      (op.orgaoDemandante &&
        op.orgaoDemandante.toLowerCase().includes(filtroOrgao.value.toLowerCase()));
    const matchesCRP =
      !filtroCRP.value ||
      (op.comandoRegional &&
        op.comandoRegional.toLowerCase().trim() === filtroCRP.value.toLowerCase().trim()) ||
      (op.crp && op.crp.toLowerCase().trim() === filtroCRP.value.toLowerCase().trim());
    const matchesArea =
      !filtroArea.value ||
      (op.area && op.area.toLowerCase().includes(filtroArea.value.toLowerCase()));
    const matchesPoliciamento =
      !filtroPoliciamento.value ||
      (op.empregoPoliciciamento &&
        op.empregoPoliciciamento.toLowerCase().includes(filtroPoliciamento.value.toLowerCase()));
    const matchesTipoRecurso =
      !filtroTipoRecurso.value ||
      (op.tipoRecurso &&
        op.tipoRecurso.toLowerCase().includes(filtroTipoRecurso.value.toLowerCase()));

    return (
      matchesBusca &&
      matchesStatus &&
      matchesMunicipio &&
      matchesOrganizacao &&
      matchesOrgao &&
      matchesCRP &&
      matchesArea &&
      matchesPoliciamento &&
      matchesTipoRecurso
    );
  });
});

const municipiosUnicos = computed(() => {
  const municipiosDasOperacoes = [
    ...new Set(store.operacoesReais.map((op) => op.municipio).filter((m) => m)),
  ];
  const municipiosDasCoordenadas = Object.keys(coordenadasMunicipiosRO);
  const todosMunicipios = [...new Set([...municipiosDasOperacoes, ...municipiosDasCoordenadas])];
  return todosMunicipios.sort((a, b) => a.localeCompare(b, "pt-BR"));
});

const orgaosUnicos = computed(() => {
  return [...new Set(store.operacoesReais.map((op) => op.orgaoDemandante).filter((o) => o))];
});

const organizacoesUnicas = computed(() => {
  return [
    ...new Set(store.operacoesReais.map((op) => op.organizacaoPolicialMilitar).filter((o) => o)),
  ];
});

const crpsUnicos = computed(() => {
  return [
    ...new Set(
      store.operacoesReais.map((op) => (op.comandoRegional || op.crp)?.trim()).filter((c) => c),
    ),
  ];
});

const areasUnicas = computed(() => {
  return [...new Set(store.operacoesReais.map((op) => op.area).filter((a) => a))];
});

const tiposRecursoUnicos = computed(() => {
  return [...new Set(store.operacoesReais.map((op) => op.empregoPoliciciamento).filter((t) => t))];
});

const recursosUnicos = computed(() => {
  return [...new Set(store.operacoesReais.map((op) => op.tipoRecurso).filter((r) => r))];
});

const totalPaginas = computed(() => Math.ceil(operacoesFiltradas.value.length / itensPorPagina));

const operacoesPaginadas = computed(() => {
  const inicio = (paginaAtual.value - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  return operacoesFiltradas.value.slice(inicio, fim);
});

const irParaPagina = (pagina: number) => {
  if (pagina >= 1 && pagina <= totalPaginas.value) {
    paginaAtual.value = pagina;
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("pt-BR");
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    rascunho: "bg-gray-100 text-gray-700",
    pendente: "bg-yellow-100 text-yellow-700",
    aprovado: "bg-green-100 text-green-700",
    rejeitado: "bg-red-100 text-red-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    rascunho: "Rascunho",
    pendente: "Pendente",
    aprovado: "Aprovado",
    rejeitado: "Rejeitado",
  };
  return labels[status] || status;
};

const limparFiltros = () => {
  busca.value = "";
  filtroStatus.value = "";
  filtroMunicipio.value = "";
  filtroOrganizacao.value = "";
  filtroOrgao.value = "";
  filtroCRP.value = "";
  filtroArea.value = "";
  filtroPoliciamento.value = "";
  filtroTipoRecurso.value = "";
};

const calcularIndicadores = (op: (typeof store.operacoes)[0]) => {
  const dias = op.totalDias > 0 ? op.totalDias : 1;
  const efetivo = op.qtdeEfetivo > 0 ? op.qtdeEfetivo : 1;

  return {
    valorPorDia: op.recursoFinanceiroEmpregado / dias,
    efetivoPorDia: op.qtdeEfetivo / dias,
    valorPorPessoa: op.recursoFinanceiroEmpregado / efetivo,
    valorPorPessoaPorDia: op.recursoFinanceiroEmpregado / (efetivo * dias),
  };
};
const mapOpContainer = ref<HTMLElement | null>(null);
let mapOp: L.Map | null = null;

const resumoPorMunicipio = computed(() => {
  const mapa: Record<
    string,
    {
      totalOperacoes: number;
      totalEfetivo: number;
      totalViaturas: number;
      totalRecurso: number;
      operacoes: string[];
      tipos: string[];
      orgaos: string[];
    }
  > = {};

  // Coletar todos os municípios únicos dos dados para debug
  const municipiosSemCoordenadas = new Set<string>();

  const processarOp = (op: (typeof store.operacoes)[0]) => {
    const municipios = (op.municipio ?? "")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    if (municipios.length === 0) return;
    for (const nome of municipios) {
      const key = encontrarChaveMunicipio(nome);
      if (!key) {
        municipiosSemCoordenadas.add(nome);
        continue;
      }
      if (!mapa[key])
        mapa[key] = {
          totalOperacoes: 0,
          totalEfetivo: 0,
          totalViaturas: 0,
          totalRecurso: 0,
          operacoes: [],
          tipos: [],
          orgaos: [],
        };
      mapa[key].totalOperacoes++;
      mapa[key].totalEfetivo += op.qtdeEfetivo || 0;
      mapa[key].totalViaturas += op.qtdeViaturas || 0;
      mapa[key].totalRecurso += op.recursoFinanceiroEmpregado || 0;
      if (op.nomeOperacaoApoio && !mapa[key].operacoes.includes(op.nomeOperacaoApoio))
        mapa[key].operacoes.push(op.nomeOperacaoApoio);
      if (op.empregoPoliciciamento && !mapa[key].tipos.includes(op.empregoPoliciciamento))
        mapa[key].tipos.push(op.empregoPoliciciamento);
      if (op.orgaoDemandante && !mapa[key].orgaos.includes(op.orgaoDemandante))
        mapa[key].orgaos.push(op.orgaoDemandante);
    }
  };

  operacoesFiltradas.value.forEach(processarOp);

  // Log dos municípios sem coordenadas (apenas em desenvolvimento)
  if (municipiosSemCoordenadas.size > 0) {
    console.warn("Municípios sem coordenadas no mapa:", Array.from(municipiosSemCoordenadas));
  }

  return mapa;
});

const formatCurrencyMap = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const initMapOp = () => {
  if (!mapOpContainer.value) {
    setTimeout(initMapOp, 200);
    return;
  }
  if (mapOp) {
    mapOp.remove();
    mapOp = null;
  }

  mapOp = L.map(mapOpContainer.value).setView([-11.0, -62.5], 7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(mapOp);

  setTimeout(renderMunicipios, 300);
};

const renderMunicipios = () => {
  if (!mapOp) return;
  const toRemove: L.Layer[] = [];
  mapOp.eachLayer((l) => {
    if (l instanceof L.CircleMarker) toRemove.push(l);
  });
  toRemove.forEach((l) => mapOp?.removeLayer(l));

  Object.entries(coordenadasMunicipiosRO).forEach(([municipio, coords]) => {
    const dados = resumoPorMunicipio.value[municipio];
    const temDados = !!dados;
    const radius = temDados ? Math.min(6 + dados.totalOperacoes * 2, 20) : 5;

    const popup = temDados
      ? `<div style="min-width:180px">
          <b style="font-size:14px">${municipio}</b><br>
          <hr style="margin:4px 0">
          <b>Operações:</b> ${dados.totalOperacoes}<br>
          <b>Efetivo total:</b> ${dados.totalEfetivo}<br>
          <b>Viaturas total:</b> ${dados.totalViaturas}<br>
          <b>Recurso empregado:</b> ${formatCurrencyMap(dados.totalRecurso)}<br>
          ${dados.tipos.length ? `<b>Tipos:</b> ${dados.tipos.slice(0, 3).join(", ")}<br>` : ""}
          ${dados.orgaos.length ? `<b>Órgãos:</b> ${dados.orgaos.slice(0, 3).join(", ")}<br>` : ""}
          ${dados.operacoes.length ? `<b>Operações:</b> ${dados.operacoes.slice(0, 3).join(", ")}` : ""}
        </div>`
      : `<b>${municipio}</b><br><small>Nenhuma operação registrada</small>`;

    L.circleMarker(coords, {
      radius,
      fillColor: temDados ? "#1e3a5f" : "#9ca3af",
      color: "#ffffff",
      weight: 2,
      opacity: 1,
      fillOpacity: temDados ? 0.85 : 0.4,
    })
      .addTo(mapOp!)
      .bindPopup(popup);
  });
};

onMounted(() => {
  const interval = setInterval(() => {
    if (mapOpContainer.value) {
      initMapOp();
      clearInterval(interval);
    }
  }, 100);
  setTimeout(() => clearInterval(interval), 5000);
});

watch(
  () => store.operacoesReais,
  () => {
    if (mapOp) renderMunicipios();
  },
  { deep: true, immediate: true },
);

watch(
  [
    busca,
    filtroStatus,
    filtroMunicipio,
    filtroOrganizacao,
    filtroOrgao,
    filtroCRP,
    filtroArea,
    filtroPoliciamento,
    filtroTipoRecurso,
  ],
  () => {
    if (mapOp) renderMunicipios();
  },
  { immediate: true },
);
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Operações</h1>
        <p class="text-gray-500">Lista de todas as operações cadastradas</p>
      </div>
    </div>

    <div class="card card-hover p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
          <input
            v-model="busca"
            type="text"
            placeholder="Nome, SEI ou Código SISEG..."
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">CRP</label>
          <select
            v-model="filtroCRP"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          >
            <option value="">Todos</option>
            <option v-for="c in crpsUnicos" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Policiamento Empregado</label>
          <select
            v-model="filtroPoliciamento"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          >
            <option value="">Todos</option>
            <option v-for="t in tiposRecursoUnicos" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tipo Recurso</label>
          <select
            v-model="filtroTipoRecurso"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          >
            <option value="">Todos</option>
            <option v-for="r in recursosUnicos" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Área</label>
          <select
            v-model="filtroArea"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          >
            <option value="">Todas</option>
            <option v-for="a in areasUnicas" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Município/Distrito</label>
          <select
            v-model="filtroMunicipio"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          >
            <option value="">Todos</option>
            <option v-for="m in municipiosUnicos" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Orgão Demandante</label>
          <select
            v-model="filtroOrgao"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          >
            <option value="">Todos</option>
            <option v-for="o in orgaosUnicos" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">BPMs</label>
          <select
            v-model="filtroOrganizacao"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          >
            <option value="">Todos</option>
            <option v-for="o in organizacoesUnicas" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
      </div>
      <div class="mt-4 flex justify-end">
        <button @click="limparFiltros" class="text-gray-500 hover:text-gray-700 text-sm">
          Limpar filtros
        </button>
      </div>
    </div>

    <div class="card p-4">
      <h2 class="text-lg font-semibold text-gray-800 mb-1">
        Mapa de Operações por Município — Rondônia
      </h2>
      <p class="text-xs text-gray-400 mb-3">
        Pontos azuis = municípios com operações (tamanho proporcional à quantidade). Pontos cinzas =
        sem operações. Clique para ver resumo.
      </p>
      <div ref="mapOpContainer" class="w-full rounded-lg" style="height: 480px"></div>
    </div>

    <div class="card overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <h3 class="text-lg font-semibold text-gray-800">Detalhamento de Operações</h3>
      </div>
      <div class="table-container !border-0 !rounded-none !shadow-none">
        <table class="custom-table">
          <thead>
            <tr>
              <th>DATA INÍCIO</th>
              <th>DIAS</th>
              <th>OPERAÇÃO</th>
              <th>MUNICÍPIO/DISTRITO</th>
              <th>TIPO</th>
              <th>ÁREA</th>
              <th>ÓRGÃO</th>
              <th>EFETIVO</th>
              <th>VIATURAS</th>
              <th>VALOR/DIA</th>
              <th>VALOR/PESSOA</th>
              <th>R$/DIA/PESSOA</th>
              <th>RECURSO EMPREGADO</th>
              <th>CRP</th>
              <th>BPM</th>
              <th>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="op in operacoesPaginadas" :key="op.id">
              <td>{{ formatDate(op.diaInicio) }}</td>
              <td>{{ op.totalDias }}</td>
              <td>
                <router-link
                  :to="`/operacoes/${op.id}`"
                  class="text-[#1e3a5f] hover:underline font-medium"
                >
                  {{ op.nomeOperacaoApoio }}
                </router-link>
              </td>
              <td class="text-gray-600">{{ op.municipio || "-" }}</td>
              <td class="text-gray-600">{{ op.empregoPoliciciamento || "-" }}</td>
              <td class="text-gray-600">{{ op.area || "-" }}</td>
              <td class="text-gray-600">{{ op.orgaoDemandante || "-" }}</td>
              <td class="text-gray-600">{{ op.qtdeEfetivo }}</td>
              <td class="text-gray-600">{{ op.qtdeViaturas }}</td>
              <td class="text-blue-600 font-medium">
                {{ formatCurrency(calcularIndicadores(op).valorPorDia) }}
              </td>
              <td class="text-purple-600 font-medium">
                {{ formatCurrency(calcularIndicadores(op).valorPorPessoa) }}
              </td>
              <td class="text-orange-600 font-medium">
                {{ formatCurrency(calcularIndicadores(op).valorPorPessoaPorDia) }}
              </td>
              <td class="text-gray-600">
                {{ formatCurrency(op.recursoFinanceiroEmpregado) }}
              </td>
              <td class="text-gray-600">
                {{ op.comandoRegional || op.crp || "-" }}
              </td>
              <td class="text-gray-600">
                {{ op.organizacaoPolicialMilitar || "-" }}
              </td>
              <td>
                <router-link
                  :to="`/operacoes/${op.id}`"
                  class="text-[#1e3a5f] hover:text-[#0f2442] inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#1e3a5f]/5 transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="operacoesFiltradas.length === 0" class="py-12 text-center text-gray-500">
        Nenhuma operação encontrada com os filtros selecionados.
      </div>
      <div v-else class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <div class="text-sm text-gray-500">
          Mostrando {{ (paginaAtual - 1) * itensPorPagina + 1 }} -
          {{ Math.min(paginaAtual * itensPorPagina, operacoesFiltradas.length) }} de
          {{ operacoesFiltradas.length }} operações
        </div>
        <div class="flex items-center gap-1">
          <button
            @click="irParaPagina(paginaAtual - 1)"
            :disabled="paginaAtual === 1"
            class="px-3 py-1 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <template v-for="pagina in totalPaginas" :key="pagina">
            <button
              v-if="
                pagina === 1 ||
                pagina === totalPaginas ||
                (pagina >= paginaAtual - 1 && pagina <= paginaAtual + 1)
              "
              @click="irParaPagina(pagina)"
              :class="
                paginaAtual === pagina
                  ? 'bg-[#1e3a5f] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              "
              class="px-3 py-1 text-sm rounded-lg border border-gray-300"
            >
              {{ pagina }}
            </button>
            <span
              v-else-if="pagina === paginaAtual - 2 || pagina === paginaAtual + 2"
              class="px-1 text-gray-400"
              >...</span
            >
          </template>
          <button
            @click="irParaPagina(paginaAtual + 1)"
            :disabled="paginaAtual === totalPaginas"
            class="px-3 py-1 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
