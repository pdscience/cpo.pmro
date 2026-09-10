<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useOperacaoStore } from "@/stores/operacao";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { coordenadasMunicipiosRO, encontrarChaveMunicipio } from "@/utils/coordenadas";

const route = useRoute();
const router = useRouter();
const store = useOperacaoStore();

const operacao = computed(() => store.operacoes.find((o) => o.id === route.params.id));

const indicadoresOp = computed(() => {
  if (!operacao.value) return null;
  return store.calcularIndicadoresOperacao(operacao.value);
});

const podeAprovar = computed(
  () =>
    operacao.value?.status === "pendente" &&
    (store.usuarioAtual?.perfil === "admin" || store.usuarioAtual?.perfil === "gestor_operacional"),
);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("pt-BR");

const formatDateTime = (dateStr: string) => new Date(dateStr).toLocaleString("pt-BR");

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  rascunho: { bg: "bg-(--color-surface-elevated)", text: "text-(--color-text-secondary)", dot: "bg-(--color-text-muted)", label: "Rascunho" },
  pendente: {
    bg: "bg-(--color-warning)/10",
    text: "text-(--color-warning)",
    dot: "bg-(--color-warning)",
    label: "Pendente",
  },
  aprovado: { bg: "bg-(--color-success)/10", text: "text-(--color-success)", dot: "bg-(--color-success)", label: "Aprovado" },
  rejeitado: { bg: "bg-(--color-pmro-danger)/10", text: "text-(--color-pmro-danger)", dot: "bg-(--color-pmro-danger)", label: "Rejeitado" },
};

const sc = computed(() => statusConfig[operacao.value?.status ?? ""] ?? statusConfig["rascunho"]!);

// Map
const mapDetalheContainer = ref<HTMLElement | null>(null);
let mapDetalhe: L.Map | null = null;

const coordsMunicipio = computed(() => {
  const m = operacao.value?.municipio?.trim();
  if (!m) return null;
  const key = encontrarChaveMunicipio(m);
  return key ? coordenadasMunicipiosRO[key] : null;
});

const initMapDetalhe = () => {
  if (!mapDetalheContainer.value) {
    setTimeout(initMapDetalhe, 200);
    return;
  }
  if (mapDetalhe) {
    mapDetalhe.remove();
    mapDetalhe = null;
  }

  const coords = coordsMunicipio.value ?? [-11.0, -62.5];
  mapDetalhe = L.map(mapDetalheContainer.value, {
    zoomControl: true,
    scrollWheelZoom: false,
  }).setView(coords, coordsMunicipio.value ? 11 : 7);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(mapDetalhe);

  if (coordsMunicipio.value && operacao.value) {
    const op = operacao.value;
    L.circleMarker(coordsMunicipio.value, {
      radius: 14,
      fillColor: "#1e3a5f",
      color: "#ffffff",
      weight: 3,
      opacity: 1,
      fillOpacity: 0.9,
    })
      .addTo(mapDetalhe)
      .bindPopup(
        `<div style="min-width:160px; font-family:sans-serif">
        <b style="font-size:13px;color:#1e3a5f">${op.municipio}</b><br>
        <hr style="margin:4px 0;border-color:#e5e7eb">
        <b>${op.nomeOperacaoApoio}</b><br>
        📅 Início: ${formatDate(op.diaInicio)}<br>
        ⏱ Duração: ${op.totalDias} dias<br>
        👮 Efetivo: ${op.qtdeEfetivo} policiais<br>
        🚔 Viaturas: ${op.qtdeViaturas}<br>
        📌 ${op.empregoPoliciciamento || ""}
      </div>`,
        { maxWidth: 220 },
      )
      .openPopup();
  }
};

onMounted(() => {
  const interval = setInterval(() => {
    if (mapDetalheContainer.value) {
      initMapDetalhe();
      clearInterval(interval);
    }
  }, 100);
  setTimeout(() => clearInterval(interval), 5000);
});

watch(
  () => operacao.value,
  () => {
    if (mapDetalhe) initMapDetalhe();
  },
);
</script>

<template>
  <div class="space-y-6" v-if="operacao">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-(--color-pmro) flex items-center justify-center shadow">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-(--color-text-primary)">{{ operacao.nomeOperacaoApoio }}</h1>
          <div class="flex items-center gap-3 mt-1">
            <span
              :class="[sc.bg, sc.text]"
              class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-sm font-medium"
            >
              <span :class="sc.dot" class="w-1.5 h-1.5 rounded-full"></span>
              {{ sc.label }}
            </span>
            <span class="text-sm text-(--color-text-muted)"
              >Criado em {{ formatDateTime(operacao.createdAt) }}</span
            >
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <router-link
          to="/operacoes"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-(--color-border) text-(--color-text-secondary) text-sm font-medium hover:bg-(--color-surface-elevated) transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Voltar
        </router-link>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="card card-accent p-5 flex items-center gap-4">
        <div
          class="w-11 h-11 rounded-lg bg-(--color-pmro)/10 flex items-center justify-center flex-shrink-0"
        >
          <svg class="w-5 h-5 text-(--color-pmro)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <div>
          <p class="text-xs text-(--color-text-muted) uppercase tracking-wide">Efetivo</p>
          <p class="text-2xl font-bold text-(--color-text-primary)">{{ operacao.qtdeEfetivo }}</p>
          <p class="text-xs text-(--color-text-muted)">policiais</p>
        </div>
      </div>

      <div class="card card-accent-blue p-5 flex items-center gap-4">
        <div class="w-11 h-11 rounded-lg bg-(--color-pmro-blue)/10 flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-(--color-pmro-blue)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
            />
          </svg>
        </div>
        <div>
          <p class="text-xs text-(--color-text-muted) uppercase tracking-wide">Viaturas</p>
          <p class="text-2xl font-bold text-(--color-text-primary)">{{ operacao.qtdeViaturas }}</p>
          <p class="text-xs text-(--color-text-muted)">veículos</p>
        </div>
      </div>

      <div class="card card-accent-purple p-5 flex items-center gap-4">
        <div
          class="w-11 h-11 rounded-lg bg-(--color-pmro-accent)/10 flex items-center justify-center flex-shrink-0"
        >
          <svg
            class="w-5 h-5 text-(--color-pmro-accent)"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <p class="text-xs text-(--color-text-muted) uppercase tracking-wide">Duração</p>
          <p class="text-2xl font-bold text-(--color-text-primary)">{{ operacao.totalDias }}</p>
          <p class="text-xs text-(--color-text-muted)">dias</p>
        </div>
      </div>

      <div class="card card-accent-green p-5 flex items-center gap-4">
        <div
          class="w-11 h-11 rounded-lg bg-(--color-success)/10 flex items-center justify-center flex-shrink-0"
        >
          <svg class="w-5 h-5 text-(--color-success)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <p class="text-xs text-(--color-text-muted) uppercase tracking-wide">Recurso</p>
          <p class="text-lg font-bold text-(--color-text-primary) leading-tight">
            {{ formatCurrency(operacao.recursoFinanceiroEmpregado) }}
          </p>
          <p class="text-xs text-(--color-text-muted)">empregado</p>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left: Operation Details -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Dados da Operação -->
        <div class="card card-accent p-6">
          <div class="flex items-center gap-2 mb-5">
            <div class="w-8 h-8 rounded-lg bg-(--color-pmro)/10 flex items-center justify-center">
              <svg
                class="w-4 h-4 text-(--color-pmro)"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 class="text-base font-semibold text-(--color-text-primary)">Dados da Operação</h2>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div class="space-y-1">
              <p class="text-xs font-medium text-(--color-text-muted) uppercase tracking-wide">
                Data de Início
              </p>
              <p class="text-sm font-semibold text-(--color-text-primary)">
                {{ formatDate(operacao.diaInicio) }}
              </p>
            </div>
            <div class="space-y-1">
              <p class="text-xs font-medium text-(--color-text-muted) uppercase tracking-wide">Total de Dias</p>
              <p class="text-sm font-semibold text-(--color-text-primary)">{{ operacao.totalDias }} dias</p>
            </div>
            <div class="space-y-1">
              <p class="text-xs font-medium text-(--color-text-muted) uppercase tracking-wide">Área</p>
              <span
                class="inline-block px-2 py-0.5 rounded text-xs font-medium"
                :class="
                  operacao.area === 'URBANA'
                    ? 'bg-(--color-pmro-blue)/10 text-(--color-pmro-blue)'
                    : 'bg-(--color-success)/10 text-(--color-success)'
                "
              >
                {{ operacao.area || "-" }}
              </span>
            </div>
            <div class="space-y-1">
              <p class="text-xs font-medium text-(--color-text-muted) uppercase tracking-wide">Município</p>
              <p class="text-sm font-semibold text-(--color-text-primary) flex items-center gap-1">
                <svg
                  class="w-3.5 h-3.5 text-(--color-text-muted)"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {{ operacao.municipio || "-" }}
              </p>
            </div>
            <div class="space-y-1">
              <p class="text-xs font-medium text-(--color-text-muted) uppercase tracking-wide">
                Emprego de Policiamento
              </p>
              <p class="text-sm font-semibold text-(--color-text-primary)">
                {{ operacao.empregoPoliciciamento || "-" }}
              </p>
            </div>
            <div class="space-y-1">
              <p class="text-xs font-medium text-(--color-text-muted) uppercase tracking-wide">
                Org. Policial Militar
              </p>
              <p class="text-sm font-semibold text-(--color-text-primary)">
                {{ operacao.organizacaoPolicialMilitar || "-" }}
              </p>
            </div>
            <div class="space-y-1">
              <p class="text-xs font-medium text-(--color-text-muted) uppercase tracking-wide">
                Órgão Demandante
              </p>
              <p class="text-sm font-semibold text-(--color-text-primary)">
                {{ operacao.orgaoDemandante || "-" }}
              </p>
            </div>
            <div class="space-y-1">
              <p class="text-xs font-medium text-(--color-text-muted) uppercase tracking-wide">
                CRP / Comando Regional
              </p>
              <p class="text-sm font-semibold text-(--color-text-primary)">
                {{ operacao.comandoRegional || operacao.crp || "-" }}
              </p>
            </div>
            <div class="space-y-1">
              <p class="text-xs font-medium text-(--color-text-muted) uppercase tracking-wide">
                Tipo de Recurso
              </p>
              <p class="text-sm font-semibold text-(--color-text-primary)">{{ operacao.tipoRecurso || "-" }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-xs font-medium text-(--color-text-muted) uppercase tracking-wide">Nº SEI</p>
              <p class="text-sm font-mono font-medium text-(--color-pmro)">
                {{ operacao.numeroSei || "-" }}
              </p>
            </div>
            <div class="space-y-1">
              <p class="text-xs font-medium text-(--color-text-muted) uppercase tracking-wide">Cód. SISEG</p>
              <p class="text-sm font-mono font-medium text-(--color-pmro)">
                {{ operacao.codOperacaoSiseg || "-" }}
              </p>
            </div>
          </div>
        </div>

        <!-- Mapa da Operação -->
        <div class="card card-accent-blue p-6">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-lg bg-(--color-pmro)/10 flex items-center justify-center">
              <svg
                class="w-4 h-4 text-(--color-pmro)"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <h2 class="text-base font-semibold text-(--color-text-primary)">Localização da Operação</h2>
              <p class="text-xs text-(--color-text-muted)">
                {{ operacao.municipio || "Município não informado" }} —
                {{ formatDate(operacao.diaInicio) }}
                <span v-if="operacao.totalDias > 1">
                  até
                  {{
                    formatDate(
                      new Date(
                        new Date(operacao.diaInicio).getTime() +
                          (operacao.totalDias - 1) * 86400000,
                      ).toISOString(),
                    )
                  }}</span
                >
              </p>
            </div>
          </div>

          <div
            v-if="!coordsMunicipio"
            class="flex items-center justify-center h-48 rounded-lg bg-(--color-surface-elevated) border border-dashed border-(--color-border)"
          >
            <div class="text-center text-(--color-text-muted)">
              <svg
                class="w-8 h-8 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              </svg>
              <p class="text-sm">Município não encontrado no mapa</p>
            </div>
          </div>

          <div ref="mapDetalheContainer" class="w-full rounded-lg" style="height: 300px"></div>
        </div>
      </div>

      <!-- Right: Indicators + Actions + Audit -->
      <div class="flex flex-col gap-6 h-full">
        <!-- Indicadores -->
        <div class="card card-accent-blue p-6 flex flex-col flex-1">
          <div class="flex items-center gap-2 mb-5">
            <div class="w-8 h-8 rounded-lg bg-(--color-pmro-blue)/10 flex items-center justify-center">
              <svg
                class="w-4 h-4 text-(--color-pmro-blue)"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h2 class="text-base font-semibold text-(--color-text-primary)">Indicadores</h2>
          </div>

          <div class="flex flex-col gap-3 flex-1 justify-between">
            <div
              class="flex items-center justify-between p-3 bg-(--color-pmro-blue)/10 rounded-lg border border-(--color-pmro-blue)/20"
            >
              <div>
                <p class="text-xs text-(--color-pmro-blue) font-medium">Valor por Dia</p>
                <p class="text-xs text-(--color-pmro-blue)/70">Recurso ÷ Dias</p>
              </div>
              <p class="text-base font-bold text-(--color-pmro-blue)">
                {{ indicadoresOp ? formatCurrency(indicadoresOp.valorPorDia) : "R$ 0,00" }}
              </p>
            </div>

            <div
              class="flex items-center justify-between p-3 bg-(--color-pmro-accent)/10 rounded-lg border border-(--color-pmro-accent)/20"
            >
              <div>
                <p class="text-xs text-(--color-pmro-accent) font-medium">Valor por Pessoa</p>
                <p class="text-xs text-(--color-pmro-accent)/70">Recurso ÷ Efetivo</p>
              </div>
              <p class="text-base font-bold text-(--color-pmro-accent)">
                {{ indicadoresOp ? formatCurrency(indicadoresOp.valorPorPessoa) : "R$ 0,00" }}
              </p>
            </div>

            <div
              class="flex items-center justify-between p-3 bg-(--color-pmro-gold)/10 rounded-lg border border-(--color-pmro-gold)/20"
            >
              <div>
                <p class="text-xs text-(--color-pmro-gold) font-medium">Valor/Pessoa/Dia</p>
                <p class="text-xs text-(--color-pmro-gold)/70">Recurso ÷ (Ef × Dias)</p>
              </div>
              <p class="text-base font-bold text-(--color-pmro-gold)">
                {{ indicadoresOp ? formatCurrency(indicadoresOp.valorPorPessoaPorDia) : "R$ 0,00" }}
              </p>
            </div>
          </div>
        </div>

        <!-- Aprovações -->
        <div v-if="podeAprovar" class="card card-accent-green p-6">
          <h2 class="text-base font-semibold text-(--color-text-primary) mb-4">Aprovação</h2>
          <div class="space-y-3">
            <button
              @click="
                () => {
                  if (operacao) store.aprovarOperacao(operacao.id);
                }
              "
              class="w-full bg-(--color-success) hover:bg-(--color-success) text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Aprovar Operação
            </button>
            <button
              @click="
                () => {
                  if (operacao) store.rejeitarOperacao(operacao.id);
                }
              "
              class="w-full bg-(--color-pmro-danger) hover:bg-(--color-pmro-danger) text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Rejeitar Operação
            </button>
          </div>
        </div>

        <!-- Auditoria -->
        <div class="card p-6 flex-1">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-lg bg-(--color-surface-elevated) flex items-center justify-center">
              <svg
                class="w-4 h-4 text-(--color-text-muted)"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h2 class="text-base font-semibold text-(--color-text-primary)">Auditoria</h2>
          </div>

          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-3 pb-3 border-b border-(--color-border-subtle)">
              <div
                class="w-7 h-7 rounded-full bg-(--color-pmro)/10 flex items-center justify-center flex-shrink-0 mt-0.5"
              >
                <svg
                  class="w-3.5 h-3.5 text-(--color-pmro)"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div>
                <p class="text-xs text-(--color-text-muted)">Criado por</p>
                <p class="font-medium text-(--color-text-primary)">{{ operacao.createdBy }}</p>
                <p class="text-xs text-(--color-text-muted)">{{ formatDateTime(operacao.createdAt) }}</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div
                class="w-7 h-7 rounded-full bg-(--color-surface-elevated) flex items-center justify-center flex-shrink-0 mt-0.5"
              >
                <svg
                  class="w-3.5 h-3.5 text-(--color-text-muted)"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <div>
                <p class="text-xs text-(--color-text-muted)">Última alteração por</p>
                <p class="font-medium text-(--color-text-primary)">{{ operacao.updatedBy }}</p>
                <p class="text-xs text-(--color-text-muted)">{{ formatDateTime(operacao.updatedAt) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-16">
    <div class="w-16 h-16 rounded-full bg-(--color-surface-elevated) flex items-center justify-center mx-auto mb-4">
      <svg class="w-8 h-8 text-(--color-text-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <p class="text-(--color-text-muted) font-medium">Operação não encontrada.</p>
    <router-link to="/operacoes" class="text-(--color-pmro) hover:underline mt-2 inline-block text-sm">
      Voltar para lista
    </router-link>
  </div>
</template>
