<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOperacaoStore } from '@/stores/operacao'
import { googleSheetsService } from '@/services/googleSheets'
import type { Operacao } from '@/types'

const router = useRouter()
const store = useOperacaoStore()

// Dados de previsão do calendário
const operacoesCalendario = ref<Operacao[]>([])
const carregandoCalendario = ref(false)
const erroCalendario = ref<string | null>(null)

// Carregar dados de previsão do calendário
async function carregarCalendario() {
  carregandoCalendario.value = true
  erroCalendario.value = null
  try {
    operacoesCalendario.value = await googleSheetsService.listarCalendario()
    if (operacoesCalendario.value.length === 0) {
      erroCalendario.value = 'Nenhuma operação encontrada no calendário. Clique em "Sincronizar" para atualizar os dados.'
    }
  } catch (error) {
    console.error('Erro ao carregar calendário:', error)
    erroCalendario.value = 'Erro ao carregar dados do calendário. Verifique a configuração da API.'
  } finally {
    carregandoCalendario.value = false
  }
}

onMounted(() => {
  carregarCalendario()
})

// Current calendar month/year
const hoje = new Date()
const mesAtual = ref(hoje.getMonth())
const anoAtual = ref(hoje.getFullYear())

// Filters
const filtroOrg = ref('')
const filtroCRP = ref('')
const filtroPoliciamento = ref('')
const filtroTipoRecurso = ref('')
const filtroArea = ref('')
const filtroMunicipio = ref('')
const filtroOrgao = ref('')

// Unique filter values
const organizacoesUnicas = computed(() => [...new Set(operacoesCalendario.value.map(o => o.organizacaoPolicialMilitar).filter(o => o))])
const crpsUnicos = computed(() => [...new Set(operacoesCalendario.value.map(o => (o.comandoRegional || o.crp)?.trim()).filter(Boolean))])
const policiamentosUnicos = computed(() => [...new Set(operacoesCalendario.value.map(o => o.empregoPoliciciamento).filter(Boolean))])
const tiposRecursoUnicos = computed(() => [...new Set(operacoesCalendario.value.map(o => o.tipoRecurso).filter(Boolean))])
const areasUnicas = computed(() => [...new Set(operacoesCalendario.value.map(o => o.area).filter(Boolean))])
const municipiosUnicos = computed(() => [...new Set(operacoesCalendario.value.map(o => o.municipio).filter(Boolean))].sort())
const orgaosUnicos = computed(() => [...new Set(operacoesCalendario.value.map(o => o.orgaoDemandante).filter(Boolean))].sort())

// Filtered operations
const operacoesFiltradas = computed(() => {
  return operacoesCalendario.value.filter(op => {
    const matchesOrg = !filtroOrg.value || op.organizacaoPolicialMilitar === filtroOrg.value
    const matchesCRP = !filtroCRP.value || (op.comandoRegional || op.crp)?.trim().toLowerCase() === filtroCRP.value.trim().toLowerCase()
    const matchesPol = !filtroPoliciamento.value || op.empregoPoliciciamento === filtroPoliciamento.value
    const matchesTipo = !filtroTipoRecurso.value || op.tipoRecurso === filtroTipoRecurso.value
    const matchesArea = !filtroArea.value || op.area === filtroArea.value
    const matchesMun = !filtroMunicipio.value || op.municipio === filtroMunicipio.value
    const matchesOrgao = !filtroOrgao.value || op.orgaoDemandante === filtroOrgao.value
    return matchesOrg && matchesCRP && matchesPol && matchesTipo && matchesArea && matchesMun && matchesOrgao
  })
})

// Calendar helpers
const mesesNomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const diasSemana = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const diasDoMes = computed(() => {
  const primeiroDia = new Date(anoAtual.value, mesAtual.value, 1).getDay()
  const totalDias = new Date(anoAtual.value, mesAtual.value + 1, 0).getDate()
  const dias: Array<{ dia: number | null; data: string | null }> = []

  for (let i = 0; i < primeiroDia; i++) dias.push({ dia: null, data: null })
  for (let d = 1; d <= totalDias; d++) {
    const data = `${anoAtual.value}-${String(mesAtual.value + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    dias.push({ dia: d, data })
  }
  return dias
})

// Get operations active on a given date
const operacoesNoDia = (dataStr: string) => {
  return operacoesFiltradas.value.filter(op => {
    if (!op.diaInicio) return false
    const inicio = new Date(op.diaInicio)
    const fim = new Date(inicio)
    fim.setDate(fim.getDate() + (op.totalDias || 1) - 1)
    const data = new Date(dataStr)
    return data >= inicio && data <= fim
  })
}

const isHoje = (dataStr: string | null) => {
  if (!dataStr) return false
  return dataStr === hoje.toISOString().split('T')[0]
}

const mesAnterior = () => {
  if (mesAtual.value === 0) { mesAtual.value = 11; anoAtual.value-- }
  else mesAtual.value--
}

const proximoMes = () => {
  if (mesAtual.value === 11) { mesAtual.value = 0; anoAtual.value++ }
  else mesAtual.value++
}

const irParaHoje = () => {
  mesAtual.value = hoje.getMonth()
  anoAtual.value = hoje.getFullYear()
}

// Auto-navigate to year with operations if current year has none
watch(operacoesCalendario, () => {
  if (operacoesCalendario.value.length > 0) {
    const anos = new Set<number>()
    operacoesCalendario.value.forEach(op => {
      if (op.diaInicio) {
        const d = new Date(op.diaInicio)
        if (!isNaN(d.getTime())) {
          anos.add(d.getFullYear())
        }
      }
    })
    const anosOrdenados = Array.from(anos).sort()
    const anoAtualTemOps = operacoesFiltradas.value.length > 0
    if (!anoAtualTemOps && anosOrdenados.length > 0 && anosOrdenados[0]) {
      anoAtual.value = anosOrdenados[0]
    }
  }
}, { immediate: true })

// Status colors
const statusColor = (status: string) => {
  const map: Record<string, string> = {
    rascunho: 'bg-gray-200 text-gray-700 border-gray-300',
    pendente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    aprovado: 'bg-green-100 text-green-800 border-green-300',
    rejeitado: 'bg-red-100 text-red-800 border-red-300',
  }
  return map[status] || 'bg-blue-100 text-blue-800 border-blue-300'
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

const dataFim = (op: Operacao) => {
  const d = new Date(op.diaInicio)
  d.setDate(d.getDate() + (op.totalDias || 1) - 1)
  return d.toLocaleDateString('pt-BR')
}

const limparFiltros = () => {
  filtroOrg.value = ''; filtroCRP.value = ''; filtroPoliciamento.value = ''
  filtroTipoRecurso.value = ''; filtroArea.value = ''; filtroMunicipio.value = ''; filtroOrgao.value = ''
}

const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]'
</script>

<template>
  <div class="space-y-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Calendário de Operações</h1>
        <p class="text-gray-500">Visualize e gerencie as operações por data</p>
      </div>
    </div>
  </div>
    <!-- Filters -->
    <div v-if="erroCalendario" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <p class="text-yellow-800 text-sm">{{ erroCalendario }}</p>
    </div>

    <div class="card p-4">
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">BPM / Organização</label>
          <select v-model="filtroOrg" :class="inputClass">
            <option value="">Todos</option>
            <option v-for="o in organizacoesUnicas" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">CRP</label>
          <select v-model="filtroCRP" :class="inputClass">
            <option value="">Todos</option>
            <option v-for="c in crpsUnicos" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Policiamento</label>
          <select v-model="filtroPoliciamento" :class="inputClass">
            <option value="">Todos</option>
            <option v-for="p in policiamentosUnicos" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Tipo Recurso</label>
          <select v-model="filtroTipoRecurso" :class="inputClass">
            <option value="">Todos</option>
            <option v-for="t in tiposRecursoUnicos" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Área</label>
          <select v-model="filtroArea" :class="inputClass">
            <option value="">Todas</option>
            <option v-for="a in areasUnicas" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Município</label>
          <select v-model="filtroMunicipio" :class="inputClass">
            <option value="">Todos</option>
            <option v-for="m in municipiosUnicos" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Órgão Demandante</label>
          <select v-model="filtroOrgao" :class="inputClass">
            <option value="">Todos</option>
            <option v-for="o in orgaosUnicos" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <div class="flex items-end">
          <button @click="limparFiltros" class="w-full border border-gray-300 text-gray-600 text-xs font-medium py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors">
            Limpar
          </button>
        </div>
      </div>
    </div>

    <!-- Calendar Navigation -->
    <div class="card p-4">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <button @click="mesAnterior" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 class="text-lg font-bold text-gray-800 min-w-[200px] text-center">
            {{ mesesNomes[mesAtual] }} {{ anoAtual }}
          </h2>
          <button @click="proximoMes" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">{{ operacoesFiltradas.length }} operações</span>
          <button @click="irParaHoje" class="px-3 py-1.5 text-xs font-medium border border-[#1e3a5f] text-[#1e3a5f] rounded-lg hover:bg-[#1e3a5f]/5 transition-colors">
            Hoje
          </button>
        </div>
      </div>

      <!-- Day headers -->
      <div class="grid grid-cols-7 mb-1">
        <div v-for="dia in diasSemana" :key="dia"
          class="text-center text-xs font-semibold text-gray-500 py-2 uppercase tracking-wide">
          {{ dia }}
        </div>
      </div>

      <!-- Calendar grid -->
      <div class="card overflow-hidden border border-gray-200 rounded-lg">
        <div
          v-for="(celula, idx) in diasDoMes"
          :key="idx"
          class="bg-white min-h-[110px] p-1.5 flex flex-col"
          :class="{ 'bg-blue-50': celula.data && isHoje(celula.data) }"
        >
          <!-- Day number -->
          <div v-if="celula.dia" class="flex items-center justify-between mb-1">
            <span
              class="text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full"
              :class="isHoje(celula.data) ? 'bg-[#1e3a5f] text-white' : 'text-gray-700'"
            >
              {{ celula.dia }}
            </span>
          </div>

          <!-- Operations on this day -->
          <div v-if="celula.data" class="flex flex-col gap-0.5 flex-1 overflow-hidden">
            <div
              v-for="op in operacoesNoDia(celula.data)"
              :key="op.id"
              class="text-xs px-1.5 py-0.5 rounded border cursor-pointer hover:opacity-80 transition-opacity truncate"
              :class="statusColor(op.status)"
              :title="`${op.nomeOperacaoApoio} — ${op.municipio} (${formatDate(op.diaInicio)} a ${dataFim(op)})`"
            >
              {{ op.nomeOperacaoApoio }}
            </div>
            <div
              v-if="operacoesNoDia(celula.data).length > 3"
              class="text-xs text-gray-400 pl-1"
            >
              +{{ operacoesNoDia(celula.data).length - 3 }} mais
            </div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="flex items-center gap-4 mt-3 flex-wrap">
        <span class="text-xs text-gray-500 font-medium">Status:</span>
        <span class="flex items-center gap-1 text-xs"><span class="w-3 h-3 rounded bg-gray-200 border border-gray-300 inline-block"></span> Rascunho</span>
        <span class="flex items-center gap-1 text-xs"><span class="w-3 h-3 rounded bg-yellow-100 border border-yellow-300 inline-block"></span> Pendente</span>
        <span class="flex items-center gap-1 text-xs"><span class="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block"></span> Aprovado</span>
        <span class="flex items-center gap-1 text-xs"><span class="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block"></span> Rejeitado</span>
      </div>
    </div>

    <!-- Operations list for current month -->
    <div class="card p-4">
      <h3 class="text-base font-semibold text-gray-800 mb-3">
        Operações em {{ mesesNomes[mesAtual] }} {{ anoAtual }}
      </h3>
      <div class="space-y-2">
        <div
          v-for="op in operacoesFiltradas.filter(op => {
            if (!op.diaInicio) return false
            const d = new Date(op.diaInicio)
            return d.getMonth() === mesAtual && d.getFullYear() === anoAtual
          })"
          :key="op.id"
          class="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0">
            <span class="px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0" :class="statusColor(op.status)">
              {{ op.status }}
            </span>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-800 truncate">{{ op.nomeOperacaoApoio }}</p>
              <p class="text-xs text-gray-500">{{ op.municipio }} · {{ formatDate(op.diaInicio) }} → {{ dataFim(op) }} ({{ op.totalDias }} dias)</p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0 ml-3">
            <router-link :to="`/operacoes/${op.id}`"
              class="p-1.5 text-gray-400 hover:text-[#1e3a5f] rounded-lg hover:bg-[#1e3a5f]/5 transition-colors"
              title="Ver detalhes">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </router-link>
          </div>
        <p v-if="!operacoesFiltradas.filter(op => {
          if (!op.diaInicio) return false
          const d = new Date(op.diaInicio)
          return d.getMonth() === mesAtual && d.getFullYear() === anoAtual
        }).length" class="text-sm text-gray-400 text-center py-6">
          Nenhuma operação neste mês com os filtros selecionados.
        </p>
      </div>
    </div>

  </div>
</template>
