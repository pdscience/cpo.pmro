<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useOperacaoStore } from "@/stores/operacao";
import { apiService } from "@/services/apiGoogleSheets";

const router = useRouter();
const store = useOperacaoStore();

// Admin auth
const ADMIN_EMAIL = "admin@cpo.com.br";
const ADMIN_PASSWORD = "admin@123456";
const isAdminLoggedIn = ref(false);
const adminEmail = ref("");
const adminPassword = ref("");
const loginError = ref("");

// Tabs
const activeTab = ref<"api" | "importar" | "auditoria">("api");

// API config
const apiUrl = ref("");
const sincronizando = ref(false);
const sincronizandoCalendario = ref(false);
const apiMessage = ref("");
const apiError = ref("");
const calendarioMessage = ref("");
const calendarioError = ref("");

// Import
const jsonData = ref("");
const importResult = ref<{ sucesso: number; erros: number } | null>(null);
const importError = ref("");
const loading = ref(false);
const scriptUrl = ref("");
const dadosImportar = ref<Record<string, unknown>[]>([]);
const mostrandoDados = ref(false);

// Audit
const auditoriaOrdenada = computed(() => {
  return [...store.auditoria].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
});

const formatDateTime = (dateStr: string) => new Date(dateStr).toLocaleString("pt-BR");

const getAcaoColor = (acao: string) => {
  const colors: Record<string, string> = {
    criar: "bg-green-100 text-green-700",
    editar: "bg-blue-100 text-blue-700",
    excluir: "bg-red-100 text-red-700",
    visualizar: "bg-gray-100 text-gray-700",
    aprobar: "bg-green-100 text-green-700",
    rejeitar: "bg-red-100 text-red-700",
  };
  return colors[acao] || "bg-gray-100 text-gray-700";
};

const getAcaoLabel = (acao: string) => {
  const labels: Record<string, string> = {
    criar: "Criação",
    editar: "Edição",
    excluir: "Exclusão",
    visualizar: "Visualização",
    aprobar: "Aprovação",
    rejeitar: "Rejeição",
  };
  return labels[acao] || acao;
};

const getOperacaoNome = (operacaoId: string) => {
  const op = store.operacoes.find((o) => o.id === operacaoId);
  return op?.nomeOperacaoApoio || "Operação não encontrada";
};

// Check if user is admin
onMounted(() => {
  apiUrl.value = apiService.getApiUrl();
});

const adminLogin = () => {
  loginError.value = "";
  if (adminEmail.value === ADMIN_EMAIL && adminPassword.value === ADMIN_PASSWORD) {
    isAdminLoggedIn.value = true;
    apiUrl.value = apiService.getApiUrl();
  } else {
    loginError.value = "Email ou senha incorretos";
  }
};

const adminLogout = () => {
  isAdminLoggedIn.value = false;
  adminEmail.value = "";
  adminPassword.value = "";
  router.push("/");
};

// API functions
const salvarUrl = () => {
  if (!apiUrl.value.trim()) {
    apiError.value = "Por favor, insira a URL da API";
    return;
  }
  apiService.setApiUrl(apiUrl.value);
  apiError.value = "";
  apiMessage.value = "URL salva com sucesso!";
  setTimeout(() => (apiMessage.value = ""), 3000);
};

const sincronizarDados = async () => {
  if (!apiUrl.value.trim()) {
    apiError.value = "Configure a URL primeiro";
    return;
  }
  sincronizando.value = true;
  apiError.value = "";
  apiMessage.value = "";
  try {
    const operacoes = (await apiService.listarOperacoes()) as Array<Record<string, unknown>>;
    if (operacoes.length > 0) {
      store.limparDados();
      const resultado = store.importarDados(JSON.stringify(operacoes));
      apiMessage.value = `${resultado.sucesso} operações sincronizadas!`;
    } else {
      apiMessage.value = "Nenhuma operação encontrada na planilha";
    }
  } catch (e) {
    apiError.value = "Erro ao sincronizar. Verifique a URL e tente novamente.";
  } finally {
    sincronizando.value = false;
  }
};

// Calendário functions
const criarCalendarioSheet = async () => {
  const url = apiService.getApiUrl();
  if (!url) {
    calendarioError.value = "Configure a URL primeiro";
    return;
  }
  sincronizandoCalendario.value = true;
  calendarioMessage.value = "";
  calendarioError.value = "";

  try {
    const response = await fetch(`${url}?action=criarCalendario`);
    const data = await response.json();
    if (data.status === "success") {
      calendarioMessage.value = data.message || "Sheet Calendário criado com sucesso!";
    } else {
      calendarioError.value = data.message || "Erro ao criar sheet Calendário";
    }
  } catch (e) {
    console.error("ErroCalendario:", e);
    calendarioError.value = "Erro ao conectar. Verifique a URL da API.";
  } finally {
    sincronizandoCalendario.value = false;
  }
};

const atualizarCalendario = async () => {
  const url = apiService.getApiUrl();
  if (!url) {
    calendarioError.value = "Configure a URL primeiro";
    return;
  }
  sincronizandoCalendario.value = true;
  calendarioMessage.value = "";
  calendarioError.value = "";

  try {
    const response = await fetch(`${url}?action=atualizarCalendario`);
    const data = await response.json();
    if (data.status === "success") {
      calendarioMessage.value = data.message || "Calendário atualizado com sucesso!";
    } else {
      calendarioError.value = data.message || "Erro ao atualizar calendário";
    }
  } catch (e) {
    console.error("ErroCalendario:", e);
    calendarioError.value = "Erro ao conectar. Verifique a URL da API.";
  } finally {
    sincronizandoCalendario.value = false;
  }
};

// Import functions
const importarJson = () => {
  importError.value = "";
  importResult.value = null;
  if (!jsonData.value.trim()) {
    importError.value = "Por favor, cole os dados JSON";
    return;
  }
  try {
    importResult.value = store.importarDados(jsonData.value);
    if (importResult.value.sucesso > 0) {
      setTimeout(() => router.push("/operacoes"), 2000);
    }
  } catch (e) {
    importError.value = "Erro ao importar. Verifique se o JSON está correto.";
  }
};

const buscarDadosSheets = async () => {
  importError.value = "";
  loading.value = true;
  if (!scriptUrl.value.trim()) {
    importError.value = "Cole a URL do Apps Script";
    loading.value = false;
    return;
  }
  try {
    const url = scriptUrl.value.trim().replace("/exec", "/exec?action=import");
    const response = await fetch(url, { method: "GET", mode: "no-cors" });
    const data = await response.json();
    if (data.status === "success" && data.data) {
      dadosImportar.value = data.data;
      mostrandoDados.value = true;
    } else {
      importError.value = data.message || "Erro ao buscar dados";
    }
  } catch (e) {
    importError.value = "Erro ao conectar. O sistema tentou buscar os dados em segundo plano.";
    dadosImportar.value = [];
    mostrandoDados.value = true;
  } finally {
    loading.value = false;
  }
};

const confirmarImportacao = () => {
  if (dadosImportar.value.length === 0) return;
  let sucesso = 0;
  let erros = 0;
  dadosImportar.value.forEach((op: Record<string, unknown>) => {
    try {
      store.criarOperacao({
        diaInicio: String(op["DATA DE INÍCIO"] || op["diaInicio"] || ""),
        totalDias: Number(op["TOTAL DE DIAS"] || op["totalDias"] || 1),
        organizacaoPolicialMilitar: String(
          op["ORGANIZAÇÃO POLICIAL MILITAR"] || op["organizacaoPolicialMilitar"] || "",
        ),
        municipio: String(op["MUNICÍPIO"] || op["municipio"] || ""),
        empregoPoliciciamento: String(
          op["EMPREGO DE POLICIAMENTO"] || op["empregoPoliciciamento"] || "",
        ),
        nomeOperacaoApoio: String(op["NOME DA OPERAÇÃO/APOIO"] || op["nomeOperacaoApoio"] || ""),
        area: String(op["ÁREA"] || op["area"] || ""),
        orgaoDemandante: String(op["ÓRGÃO DEMANDANTE"] || op["orgaoDemandante"] || ""),
        numeroSei: String(op["Nº SEI"] || op["numeroSei"] || ""),
        qtdeEfetivo: Number(op["QTDE EFETIVO"] || op["qtdeEfetivo"] || 0),
        qtdeViaturas: Number(op["QTDE VIATURAS"] || op["qtdeViaturas"] || 0),
        recursoFinanceiroEmpregado: Number(
          op["RECURSO EMPREGADO"] || op["recursoFinanceiroEmpregado"] || 0,
        ),
        valorGasto: Number(op["VALOR GASTO"] || op["valorGasto"] || 0),
        codOperacaoSiseg: String(op["CÓD. OPERAÇÃO SISEG"] || op["codOperacaoSiseg"] || ""),
        comandoRegional: String(op["COMANDO REGIONAL"] || op["comandoRegional"] || ""),
        crp: String(op["CRP"] || op["crp"] || ""),
        tipoRecurso: String(op["TIPO FINANCEIRO EMPREGADO"] || op["tipoRecurso"] || ""),
      });
      sucesso++;
    } catch {
      erros++;
    }
  });
  importResult.value = { sucesso, erros };
  mostrandoDados.value = false;
  dadosImportar.value = [];
};

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]";
</script>

<template>
  <div class="space-y-6">
    <!-- Login form if not admin -->
    <div v-if="!isAdminLoggedIn" class="max-w-md mx-auto mt-20">
      <div class="card card-accent p-8">
        <div class="text-center mb-6">
          <div
            class="w-16 h-16 bg-[#1e3a5f] rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 class="text-xl font-bold text-gray-900">Acesso Administrativo</h1>
          <p class="text-sm text-gray-500 mt-1">Faça login para acessar as configurações</p>
        </div>

        <form @submit.prevent="adminLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              v-model="adminEmail"
              type="email"
              :class="inputClass"
              placeholder="email@dominio.com.br"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              v-model="adminPassword"
              type="password"
              :class="inputClass"
              placeholder="••••••••"
              required
            />
          </div>
          <div v-if="loginError" class="text-red-600 text-sm text-center">{{ loginError }}</div>
          <button
            type="submit"
            class="w-full bg-[#1e3a5f] hover:bg-[#0f2442] text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            Entrar
          </button>
        </form>

        <div class="mt-6 pt-6 border-t border-gray-100 text-center">
          <router-link to="/" class="text-sm text-[#1e3a5f] hover:underline">
            ← Voltar para o sistema
          </router-link>
        </div>
      </div>
    </div>

    <!-- Admin content -->
    <div v-else>
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Administração</h1>
          <p class="text-gray-500">Configurações e ferramentas administrativas</p>
        </div>
        <button
          @click="adminLogout"
          class="text-sm text-red-600 hover:underline flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Sair
        </button>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <nav class="flex gap-6">
          <button
            @click="activeTab = 'api'"
            :class="[
              'py-3 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'api'
                ? 'border-[#1e3a5f] text-[#1e3a5f]'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ]"
          >
            API Google Sheets
          </button>
          <button
            @click="activeTab = 'importar'"
            :class="[
              'py-3 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'importar'
                ? 'border-[#1e3a5f] text-[#1e3a5f]'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ]"
          >
            Importar Dados
          </button>
          <button
            @click="activeTab = 'auditoria'"
            :class="[
              'py-3 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'auditoria'
                ? 'border-[#1e3a5f] text-[#1e3a5f]'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ]"
          >
            Auditoria
          </button>
        </nav>
      </div>

      <!-- API Tab -->
      <div v-if="activeTab === 'api'" class="space-y-6">
        <div class="card card-accent-blue p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Configuração da API</h2>
          <p class="text-sm text-gray-500 mb-4">
            Conecte o sistema à planilha Google Sheets para sincronização automática.
          </p>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">URL do Apps Script</label>
              <input
                v-model="apiUrl"
                type="text"
                :class="inputClass"
                placeholder="https://script.google.com/..."
              />
            </div>
            <div class="flex gap-3">
              <button
                @click="salvarUrl"
                class="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#0f2442] transition-colors"
              >
                Salvar URL
              </button>
              <button
                @click="sincronizarDados"
                :disabled="sincronizando"
                class="px-4 py-2 border border-[#1e3a5f] text-[#1e3a5f] rounded-lg text-sm font-medium hover:bg-[#1e3a5f]/5 transition-colors disabled:opacity-50"
              >
                {{ sincronizando ? "Sincronizando..." : "Sincronizar Dados" }}
              </button>
            </div>
            <div v-if="apiMessage" class="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              {{ apiMessage }}
            </div>
            <div v-if="apiError" class="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {{ apiError }}
            </div>
          </div>
        </div>

        <!-- Calendário Sheet Configuration -->
        <div class="card card-accent-green p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Calendário Google Sheets</h2>
          <p class="text-sm text-gray-500 mb-4">
            Configure a aba "Calendário" na planilha para exibir as operações no calendário.
          </p>

          <div class="space-y-4">
            <div class="flex gap-3">
              <button
                @click="criarCalendarioSheet"
                :disabled="sincronizandoCalendario"
                class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {{ sincronizandoCalendario ? "Criando..." : "Criar Aba Calendário" }}
              </button>
              <button
                @click="atualizarCalendario"
                :disabled="sincronizandoCalendario"
                class="px-4 py-2 border border-green-600 text-green-600 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors disabled:opacity-50"
              >
                {{ sincronizandoCalendario ? "Atualizando..." : "Atualizar Calendário" }}
              </button>
            </div>
            <div v-if="calendarioMessage" class="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              {{ calendarioMessage }}
            </div>
            <div v-if="calendarioError" class="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {{ calendarioError }}
            </div>
          </div>
        </div>
      </div>

      <!-- Import Tab -->
      <div v-if="activeTab === 'importar'" class="space-y-6">
        <div class="card card-accent-purple p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Importar de Planilha Google</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">URL do Apps Script</label>
              <input
                v-model="scriptUrl"
                type="text"
                :class="inputClass"
                placeholder="https://script.google.com/..."
              />
            </div>
            <button
              @click="buscarDadosSheets"
              :disabled="loading"
              class="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#0f2442] transition-colors disabled:opacity-50"
            >
              {{ loading ? "Buscando..." : "Buscar Dados" }}
            </button>
          </div>
        </div>

        <div class="card card-accent-purple p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Importar via JSON</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Cole os dados JSON aqui</label
              >
              <textarea
                v-model="jsonData"
                rows="6"
                :class="inputClass"
                placeholder='[{"diaInicio": "2024-01-01", ...}]'
              ></textarea>
            </div>
            <button
              @click="importarJson"
              class="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#0f2442] transition-colors"
            >
              Importar JSON
            </button>
            <div v-if="importError" class="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {{ importError }}
            </div>
            <div v-if="importResult" class="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              {{ importResult.sucesso }} operação(ões) importada(s),
              {{ importResult.erros }} erro(s).
            </div>
          </div>
        </div>

        <!-- Preview data -->
        <div
          v-if="mostrandoDados && dadosImportar.length > 0"
          class="card p-6"
        >
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-800">
              {{ dadosImportar.length }} registros encontrados
            </h2>
            <div class="flex gap-2">
              <button
                @click="confirmarImportacao"
                class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Confirmar Importação
              </button>
              <button
                @click="
                  mostrandoDados = false;
                  dadosImportar = [];
                "
                class="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
          <div class="table-container">
            <table class="custom-table custom-table-dense">
              <thead>
                <tr>
                  <th class="text-left py-2 px-2 text-xs font-semibold text-gray-500">Operação</th>
                  <th class="text-left py-2 px-2 text-xs font-semibold text-gray-500">Município</th>
                  <th class="text-left py-2 px-2 text-xs font-semibold text-gray-500">
                    Data Início
                  </th>
                  <th class="text-left py-2 px-2 text-xs font-semibold text-gray-500">Dias</th>
                  <th class="text-left py-2 px-2 text-xs font-semibold text-gray-500">Efetivo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(op, idx) in dadosImportar" :key="idx">
                  <td class="py-2 px-2">
                    {{ op["NOME DA OPERAÇÃO/APOIO"] || op["nomeOperacaoApoio"] }}
                  </td>
                  <td class="py-2 px-2">{{ op["MUNICÍPIO"] || op["municipio"] }}</td>
                  <td class="py-2 px-2">{{ op["DATA DE INÍCIO"] || op["diaInicio"] }}</td>
                  <td class="py-2 px-2">{{ op["TOTAL DE DIAS"] || op["totalDias"] }}</td>
                  <td class="py-2 px-2">{{ op["QTDE EFETIVO"] || op["qtdeEfetivo"] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Audit Tab -->
      <div
        v-if="activeTab === 'auditoria'"
        class="card p-6"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800">Histórico de Ações</h2>
          <span class="text-sm text-gray-500">{{ auditoriaOrdenada.length }} registros</span>
        </div>

        <div v-if="auditoriaOrdenada.length === 0" class="text-center py-12 text-gray-500">
          Nenhuma ação registrada ainda.
        </div>

        <div v-else class="space-y-4 max-h-[600px] overflow-y-auto">
          <div
            v-for="registro in auditoriaOrdenada"
            :key="registro.id"
            class="card card-hover p-4"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-3">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center"
                  :class="getAcaoColor(registro.acao)"
                >
                  <svg
                    v-if="registro.acao === 'criar'"
                    class="w-5 h-5"
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
                  <svg
                    v-else-if="registro.acao === 'editar'"
                    class="w-5 h-5"
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
                  <svg
                    v-else-if="registro.acao === 'excluir'"
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-gray-800">{{ getAcaoLabel(registro.acao) }}</p>
                  <p class="text-sm text-gray-600">{{ getOperacaoNome(registro.operacaoId) }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ formatDateTime(registro.timestamp) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
