<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useOperacaoStore } from "@/stores/operacao";
import type { Operacao } from "@/types";

const router = useRouter();
const store = useOperacaoStore();

const erros = ref<string[]>([]);
const salvando = ref(false);

const form = ref({
  diaInicio: "",
  totalDias: 1,
  organizacaoPolicialMilitar: "",
  municipio: "",
  empregoPoliciciamento: "",
  nomeOperacaoApoio: "",
  area: "",
  orgaoDemandante: "",
  numeroSei: "",
  qtdeEfetivo: 0,
  qtdeViaturas: 0,
  recursoFinanceiroEmpregado: 0,
  valorGasto: 0,
  codOperacaoSiseg: "",
});

const custoPorDia = computed(() => {
  if (form.value.totalDias <= 0) return 0;
  return form.value.valorGasto / form.value.totalDias;
});

const custoPorEfetivo = computed(() => {
  if (form.value.qtdeEfetivo <= 0) return 0;
  return form.value.valorGasto / form.value.qtdeEfetivo;
});

const percentualExecucao = computed(() => {
  if (form.value.recursoFinanceiroEmpregado <= 0) return 0;
  return (form.value.valorGasto / form.value.recursoFinanceiroEmpregado) * 100;
});

const saldoRestante = computed(() => {
  return form.value.recursoFinanceiroEmpregado - form.value.valorGasto;
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const validar = (): boolean => {
  erros.value = [];

  if (!form.value.diaInicio) erros.value.push("Data de início é obrigatória");
  if (form.value.totalDias < 1) erros.value.push("Total de dias deve ser pelo menos 1");
  if (!form.value.organizacaoPolicialMilitar)
    erros.value.push("Organização Policial é obrigatória");
  if (!form.value.municipio) erros.value.push("Município é obrigatório");
  if (!form.value.empregoPoliciciamento) erros.value.push("Emprego de policiamento é obrigatório");
  if (!form.value.nomeOperacaoApoio) erros.value.push("Nome da operação é obrigatório");
  if (!form.value.area) erros.value.push("Área é obrigatória");
  if (!form.value.orgaoDemandante) erros.value.push("Órgão demandante é obrigatório");
  if (!form.value.numeroSei) erros.value.push("Número SEI é obrigatório");
  if (form.value.qtdeEfetivo < 0) erros.value.push("Quantidade de efetivo não pode ser negativa");
  if (form.value.qtdeViaturas < 0) erros.value.push("Quantidade de viaturas não pode ser negativa");
  if (form.value.recursoFinanceiroEmpregado < 0)
    erros.value.push("Recurso financeiro não pode ser negativo");
  if (form.value.valorGasto < 0) erros.value.push("Valor gasto não pode ser negativo");
  if (!form.value.codOperacaoSiseg) erros.value.push("Código SISEG é obrigatório");

  return erros.value.length === 0;
};

const salvar = async (status: "rascunho" | "pendente") => {
  if (!validar()) return;

  salvando.value = true;

  const operacao = store.criarOperacao({
    diaInicio: form.value.diaInicio,
    totalDias: form.value.totalDias,
    organizacaoPolicialMilitar: form.value.organizacaoPolicialMilitar,
    municipio: form.value.municipio,
    empregoPoliciciamento: form.value.empregoPoliciciamento,
    nomeOperacaoApoio: form.value.nomeOperacaoApoio,
    area: form.value.area,
    orgaoDemandante: form.value.orgaoDemandante,
    numeroSei: form.value.numeroSei,
    qtdeEfetivo: form.value.qtdeEfetivo,
    qtdeViaturas: form.value.qtdeViaturas,
    recursoFinanceiroEmpregado: form.value.recursoFinanceiroEmpregado,
    valorGasto: form.value.valorGasto,
    codOperacaoSiseg: form.value.codOperacaoSiseg,
  });

  if (status === "pendente") {
    store.submeterAprovacao(operacao.id);
  }

  salvando.value = false;
  router.push("/operacoes");
};
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-(--color-text-primary)">Nova Operação</h1>
        <p class="text-(--color-text-muted)">Cadastrar nova operação policial</p>
      </div>
      <router-link
        to="/operacoes"
        class="text-(--color-text-muted) hover:text-(--color-text-secondary) flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

    <div v-if="erros.length > 0" class="bg-(--color-pmro-danger)/10 border border-(--color-pmro-danger)/30 rounded-lg p-4">
      <ul class="list-disc list-inside text-(--color-pmro-danger)">
        <li v-for="erro in erros" :key="erro">{{ erro }}</li>
      </ul>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="card card-accent-blue p-6">
          <h2 class="text-lg font-semibold text-(--color-text-primary) mb-4">Dados da Operação</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-(--color-text-secondary) mb-1">
                DATA DE INÍCIO <span class="text-(--color-pmro-danger)">*</span>
              </label>
              <input
                v-model="form.diaInicio"
                type="date"
                class="w-full border border-(--color-border) rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-pmro)/20 focus:border-(--color-pmro)"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-(--color-text-secondary) mb-1">
                TOTAL DE DIAS <span class="text-(--color-pmro-danger)">*</span>
              </label>
              <input
                v-model.number="form.totalDias"
                type="number"
                min="1"
                class="w-full border border-(--color-border) rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-pmro)/20 focus:border-(--color-pmro)"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-(--color-text-secondary) mb-1">
                ORGANIZAÇÃO POLICIAL MILITAR <span class="text-(--color-pmro-danger)">*</span>
              </label>
              <select
                v-model="form.organizacaoPolicialMilitar"
                class="w-full border border-(--color-border) rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-pmro)/20 focus:border-(--color-pmro)"
              >
                <option value="">Selecione</option>
                <option v-for="op in store.organizacoesPoliciais" :key="op" :value="op">
                  {{ op }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-(--color-text-secondary) mb-1">
                MUNICÍPIO <span class="text-(--color-pmro-danger)">*</span>
              </label>
              <select
                v-model="form.municipio"
                class="w-full border border-(--color-border) rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-pmro)/20 focus:border-(--color-pmro)"
              >
                <option value="">Selecione</option>
                <option v-for="m in store.municipios" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-(--color-text-secondary) mb-1">
                EMPREGO DE POLICIAMENTO <span class="text-(--color-pmro-danger)">*</span>
              </label>
              <select
                v-model="form.empregoPoliciciamento"
                class="w-full border border-(--color-border) rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-pmro)/20 focus:border-(--color-pmro)"
              >
                <option value="">Selecione</option>
                <option v-for="e in store.empregosPoliciciamento" :key="e" :value="e">
                  {{ e }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-(--color-text-secondary) mb-1">
                ÁREA <span class="text-(--color-pmro-danger)">*</span>
              </label>
              <select
                v-model="form.area"
                class="w-full border border-(--color-border) rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-pmro)/20 focus:border-(--color-pmro)"
              >
                <option value="">Selecione</option>
                <option v-for="a in store.areas" :key="a" :value="a">{{ a }}</option>
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-(--color-text-secondary) mb-1">
                NOME DA OPERAÇÃO/APOIO <span class="text-(--color-pmro-danger)">*</span>
              </label>
              <input
                v-model="form.nomeOperacaoApoio"
                type="text"
                placeholder="Ex: Operação Guardião de Fronteiras"
                class="w-full border border-(--color-border) rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-pmro)/20 focus:border-(--color-pmro)"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-(--color-text-secondary) mb-1">
                ÓRGÃO DEMANDANTE <span class="text-(--color-pmro-danger)">*</span>
              </label>
              <select
                v-model="form.orgaoDemandante"
                class="w-full border border-(--color-border) rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-pmro)/20 focus:border-(--color-pmro)"
              >
                <option value="">Selecione</option>
                <option v-for="o in store.orgaosDemandantes" :key="o" :value="o">{{ o }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-(--color-text-secondary) mb-1">
                Nº SEI <span class="text-(--color-pmro-danger)">*</span>
              </label>
              <input
                v-model="form.numeroSei"
                type="text"
                placeholder="Ex: 2025.0001.000001-00"
                class="w-full border border-(--color-border) rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-pmro)/20 focus:border-(--color-pmro)"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-(--color-text-secondary) mb-1">
                CÓD. OPERAÇÃO SISEG <span class="text-(--color-pmro-danger)">*</span>
              </label>
              <input
                v-model="form.codOperacaoSiseg"
                type="text"
                placeholder="Ex: SISEG-2025-001"
                class="w-full border border-(--color-border) rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-pmro)/20 focus:border-(--color-pmro)"
              />
            </div>
          </div>
        </div>

        <div class="card card-accent-blue p-6">
          <h2 class="text-lg font-semibold text-(--color-text-primary) mb-4">Recursos Empregados</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-(--color-text-secondary) mb-1">
                QTDE EFETIVO <span class="text-(--color-pmro-danger)">*</span>
              </label>
              <input
                v-model.number="form.qtdeEfetivo"
                type="number"
                min="0"
                class="w-full border border-(--color-border) rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-pmro)/20 focus:border-(--color-pmro)"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-(--color-text-secondary) mb-1">
                QTDE VIATURAS <span class="text-(--color-pmro-danger)">*</span>
              </label>
              <input
                v-model.number="form.qtdeViaturas"
                type="number"
                min="0"
                class="w-full border border-(--color-border) rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-pmro)/20 focus:border-(--color-pmro)"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-(--color-text-secondary) mb-1">
                RECURSO FINANCEIRO EMPREGADO (R$) <span class="text-(--color-pmro-danger)">*</span>
              </label>
              <input
                v-model.number="form.recursoFinanceiroEmpregado"
                type="number"
                min="0"
                step="0.01"
                class="w-full border border-(--color-border) rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-pmro)/20 focus:border-(--color-pmro)"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-(--color-text-secondary) mb-1">
                VALOR GASTO (R$) <span class="text-(--color-pmro-danger)">*</span>
              </label>
              <input
                v-model.number="form.valorGasto"
                type="number"
                min="0"
                step="0.01"
                class="w-full border border-(--color-border) rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-pmro)/20 focus:border-(--color-pmro)"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="card card-accent-purple p-6">
          <h2 class="text-lg font-semibold text-(--color-text-primary) mb-4">Indicadores</h2>

          <div class="space-y-4">
            <div class="p-4 bg-(--color-surface-elevated) rounded-lg">
              <p class="text-sm text-(--color-text-muted)">Custo por Dia</p>
              <p class="text-xl font-bold text-(--color-text-primary)">{{ formatCurrency(custoPorDia) }}</p>
            </div>

            <div class="p-4 bg-(--color-surface-elevated) rounded-lg">
              <p class="text-sm text-(--color-text-muted)">Custo por Efetivo</p>
              <p class="text-xl font-bold text-(--color-text-primary)">{{ formatCurrency(custoPorEfetivo) }}</p>
            </div>

            <div class="p-4 bg-(--color-surface-elevated) rounded-lg">
              <p class="text-sm text-(--color-text-muted)">Execução Orçamentária</p>
              <p
                class="text-xl font-bold"
                :class="percentualExecucao > 100 ? 'text-(--color-pmro-danger)' : 'text-(--color-text-primary)'"
              >
                {{ percentualExecucao.toFixed(1) }}%
              </p>
            </div>

            <div class="p-4 bg-(--color-surface-elevated) rounded-lg">
              <p class="text-sm text-(--color-text-muted)">Saldo Restante</p>
              <p
                class="text-xl font-bold"
                :class="saldoRestante >= 0 ? 'text-(--color-success)' : 'text-(--color-pmro-danger)'"
              >
                {{ formatCurrency(saldoRestante) }}
              </p>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h2 class="text-lg font-semibold text-(--color-text-primary) mb-4">Ações</h2>

          <div class="space-y-3">
            <button
              @click="salvar('rascunho')"
              :disabled="salvando"
              class="w-full bg-(--color-surface-elevated) hover:bg-(--color-border) text-(--color-text-secondary) font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              Salvar Rascunho
            </button>

            <button
              @click="salvar('pendente')"
              :disabled="salvando"
              class="w-full bg-(--color-pmro) hover:bg-(--color-pmro-blue) text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Submeter à Aprovação
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
