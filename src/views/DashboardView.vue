<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOperacaoStore } from '@/stores/operacao'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

// Fix Leaflet default icon paths broken by Vite bundling
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

import { coordenadasMunicipiosRO, encontrarChaveMunicipio } from "@/utils/coordenadas";

const router = useRouter();
const store = useOperacaoStore();

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;

const ANO_DASHBOARD = new Date().getFullYear().toString();

const operacoesAno = computed(() => 
  store.operacoesReais.filter(op => op.diaInicio && op.diaInicio.startsWith(ANO_DASHBOARD))
);

const indicadoresGerais = computed(() => {
  const ops = operacoesAno.value;
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

const totalPoliciamentoEmpregado = computed(() => {
  return operacoesAno.value.reduce((sum, op) => sum + (op.empregoPoliciciamento ? 1 : 0), 0)
})

const operacoesPorTipo = computed(() => {
  const tipos: Record<string, number> = {}
  operacoesAno.value.forEach(op => {
    const tipo = op.empregoPoliciciamento || 'Não informado'
    tipos[tipo] = (tipos[tipo] || 0) + 1
  })
  return Object.entries(tipos).map(([tipo, total]) => ({ tipo, total })).sort((a, b) => b.total - a.total)
})

const operacoesPorCRP = computed(() => {
  const crps: Record<string, number> = {}
  operacoesAno.value.forEach(op => {
    const crp = op.comandoRegional || op.crp || 'Não informado'
    crps[crp] = (crps[crp] || 0) + 1
  })
  return Object.entries(crps).map(([crp, total]) => ({ crp, total })).sort((a, b) => b.total - a.total).slice(0, 10)
})

const operacoesPorOrgao = computed(() => {
  const orgoes: Record<string, number> = {}
  operacoesAno.value.forEach(op => {
    const orgao = op.orgaoDemandante || 'Não informado'
    orgoes[orgao] = (orgoes[orgao] || 0) + 1
  })
  return Object.entries(orgoes).map(([orgao, total]) => ({ orgao, total })).sort((a, b) => b.total - a.total).slice(0, 10)
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value)
}

const operacoesPorMes = computed(() => {
  const meses: Record<string, number> = {}
  const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  
  operacoesAno.value.forEach(op => {
    if (!op.diaInicio) return
    const [year, month, day] = op.diaInicio.split('-').map(Number)
    if (!year || !month) return
    const mes = mesesNomes[month - 1] || ''
    meses[mes] = (meses[mes] || 0) + 1
  })
  
  return mesesNomes.map(mes => ({ mes, total: meses[mes] || 0 }))
})

const maxPorMes = computed(() => Math.max(...operacoesPorMes.value.map(o => o.total), 1))
const maxPorTipo = computed(() => Math.max(...operacoesPorTipo.value.map(o => o.total), 1))
const maxPorCRP = computed(() => Math.max(...operacoesPorCRP.value.map(o => o.total), 1))
const maxPorOrgao = computed(() => Math.max(...operacoesPorOrgao.value.map(o => o.total), 1))

const initMap = () => {
  if (!mapContainer.value) {
    setTimeout(initMap, 200)
    return
  }
  
  if (map) {
    map.remove()
    map = null
  }
  
  map = L.map(mapContainer.value).setView([-11.0, -62.5], 7)
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)
  
  setTimeout(atualizarMarcadores, 300)
}

const atualizarMarcadores = () => {
  if (!map) return
  
  // Remove only circle markers and regular markers
  const toRemove: L.Layer[] = []
  map.eachLayer(layer => {
    if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
      toRemove.push(layer)
    }
  })
  toRemove.forEach(layer => map?.removeLayer(layer))

  // Group operations by municipality
  const porMunicipio: Record<string, { count: number; efetivo: number; nomes: string[] }> = {}
  operacoesAno.value.forEach(op => {
    const municipios = (op.municipio ?? '').split(',').map(m => m.trim()).filter(Boolean);
    for (const nome of municipios) {
      const key = encontrarChaveMunicipio(nome);
      if (!key) continue
      if (!porMunicipio[key]) porMunicipio[key] = { count: 0, efetivo: 0, nomes: [] }
      porMunicipio[key].count++
      porMunicipio[key].efetivo += op.qtdeEfetivo || 0
      if (op.nomeOperacaoApoio && !porMunicipio[key].nomes.includes(op.nomeOperacaoApoio))
        porMunicipio[key].nomes.push(op.nomeOperacaoApoio)
    }
  })

  // Render all municipalities
  Object.entries(coordenadasMunicipiosRO).forEach(([municipio, coords]) => {
    const dados = porMunicipio[municipio]
    const temDados = !!dados
    const radius = temDados ? Math.min(6 + dados.count * 2, 20) : 5

    const popup = temDados
      ? `<div style="min-width:180px">
          <b style="font-size:14px">${municipio}</b><br>
          <hr style="margin:4px 0">
          <b>Operações:</b> ${dados.count}<br>
          <b>Efetivo total:</b> ${dados.efetivo}
          ${dados.nomes.length ? `<br><small>${dados.nomes.slice(0, 3).join(', ')}</small>` : ''}
        </div>`
      : `<b>${municipio}</b><br><small>Nenhuma operação registrada</small>`

    L.circleMarker(coords, {
      radius,
      fillColor: temDados ? '#1e3a5f' : '#9ca3af',
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: temDados ? 0.85 : 0.4
    })
      .addTo(map!)
      .bindPopup(popup)
  })
}

onMounted(() => {
  const interval = setInterval(() => {
    if (mapContainer.value) {
      initMap()
      clearInterval(interval)
    }
  }, 100)
  
  setTimeout(() => clearInterval(interval), 5000)
})

watch(() => operacoesAno.value, () => {
  if (map) {
    atualizarMarcadores()
  }
}, { deep: true })
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Dashboard Estratégico - 2026</h1>
        <p class="text-gray-500">Visão geral das operações policiais</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500">Usuário:</span>
        <span class="font-medium text-[#1e3a5f]">{{ store.usuarioAtual?.nome }}</span>
        <span class="px-2 py-1 bg-[#1e3a5f]/10 text-[#1e3a5f] text-xs rounded-full">
          {{ store.usuarioAtual?.perfil.replace('_', ' ') }}
        </span>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card card-hover card-accent p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">Total Recurso Empregado</p>
            <p class="text-2xl font-bold text-gray-800">{{ formatCurrency(indicadoresGerais.totalOrcamento) }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="card card-hover card-accent-green p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">Total Policiamento Empregado</p>
            <p class="text-2xl font-bold text-gray-800">{{ formatNumber(totalPoliciamentoEmpregado) }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="card card-hover card-accent-purple p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">Total Efetivo</p>
            <p class="text-2xl font-bold text-gray-800">{{ formatNumber(indicadoresGerais.totalEfetivo) }}</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="card card-hover card-accent-orange p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">Total Viaturas</p>
            <p class="text-2xl font-bold text-gray-800">{{ formatNumber(indicadoresGerais.totalViaturas) }}</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="card card-hover card-accent-cyan p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500">Municípios/Distrito</p>
            <p class="text-xl font-bold text-gray-800">{{ indicadoresGerais.totalMunicipios }}</p>
          </div>
          <div class="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="card card-hover card-accent-pink p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500">Órgãos Demandantes</p>
            <p class="text-xl font-bold text-gray-800">{{ indicadoresGerais.totalOrgoes }}</p>
          </div>
          <div class="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>
      </div>

      <div class="card card-hover card-accent-blue p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500">Área Urbana</p>
            <p class="text-xl font-bold text-blue-600">{{ indicadoresGerais.totalUrbana }}</p>
          </div>
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>
      </div>

      <div class="card card-hover card-accent-green p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500">Área Rural</p>
            <p class="text-xl font-bold text-green-600">{{ indicadoresGerais.totalRural }}</p>
          </div>
          <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <div class="card card-hover p-4">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Mapa de Operações por Município</h2>
      <div class="flex justify-center">
        <div ref="mapContainer" class="rounded-lg" style="width: 100%; height: 520px;"></div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card card-hover p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Operações por Mês</h2>
        <div class="flex items-end justify-between h-48 gap-2">
          <div v-for="item in operacoesPorMes" :key="item.mes" class="flex flex-col items-center flex-1">
            <div class="w-full flex flex-col items-center">
              <span class="text-xs text-gray-500 mb-1">{{ item.total }}</span>
              <div 
                class="w-full bg-[#1e3a5f] rounded-t transition-all duration-300"
                :style="{ height: `${(item.total / maxPorMes) * 140}px`, minHeight: item.total > 0 ? '4px' : '0' }"
              ></div>
            </div>
            <span class="text-xs text-gray-600 mt-2">{{ item.mes.slice(0, 3) }}</span>
          </div>
        </div>
      </div>

      <div class="card card-hover p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Operações por Tipo de Policiamento</h2>
        <div class="space-y-3 max-h-48 overflow-y-auto">
          <div v-for="item in operacoesPorTipo" :key="item.tipo" class="flex items-center gap-3">
            <span class="text-xs text-gray-600 w-32 truncate" :title="item.tipo">{{ item.tipo }}</span>
            <div class="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div 
                class="h-full bg-[#1e3a5f] rounded-full transition-all duration-300"
                :style="{ width: `${(item.total / maxPorTipo) * 100}%` }"
              ></div>
            </div>
            <span class="text-xs font-medium text-gray-700 w-6">{{ item.total }}</span>
          </div>
        </div>
      </div>

      <div class="card card-hover p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Operações por CRP</h2>
        <div class="space-y-3 max-h-48 overflow-y-auto">
          <div v-for="item in operacoesPorCRP" :key="item.crp" class="flex items-center gap-3">
            <span class="text-xs text-gray-600 w-24 truncate" :title="item.crp">{{ item.crp }}</span>
            <div class="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div 
                class="h-full bg-[#1e3a5f] rounded-full transition-all duration-300"
                :style="{ width: `${(item.total / maxPorCRP) * 100}%` }"
              ></div>
            </div>
            <span class="text-xs font-medium text-gray-700 w-6">{{ item.total }}</span>
          </div>
        </div>
      </div>

      <div class="card card-hover p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Operações por Órgão Demandante</h2>
        <div class="space-y-3 max-h-48 overflow-y-auto">
          <div v-for="item in operacoesPorOrgao" :key="item.orgao" class="flex items-center gap-3">
            <span class="text-xs text-gray-600 w-24 truncate" :title="item.orgao">{{ item.orgao }}</span>
            <div class="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div 
                class="h-full bg-[#1e3a5f] rounded-full transition-all duration-300"
                :style="{ width: `${(item.total / maxPorOrgao) * 100}%` }"
              ></div>
            </div>
            <span class="text-xs font-medium text-gray-700 w-6">{{ item.total }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.leaflet-container {
  z-index: 0;
}
</style>
