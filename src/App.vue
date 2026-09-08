<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useOperacaoStore } from "@/stores/operacao";
import { apiService } from "@/services/apiGoogleSheets";
import { googleSheetsService } from "@/services/googleSheets";

const route = useRoute();
const router = useRouter();
const store = useOperacaoStore();

const isAuthenticated = computed(() => !!store.usuarioAtual);

onMounted(async () => {
  let apiUrl = apiService.getApiUrl();
  if (!apiUrl && import.meta.env.VITE_GOOGLE_SHEETS_API_URL) {
    apiUrl = import.meta.env.VITE_GOOGLE_SHEETS_API_URL;
    apiService.setApiUrl(apiUrl);
  }
  if (apiUrl) {
    try {
      const operacoesRaw = (await apiService.listarOperacoes()) as Array<Record<string, unknown>>;
      if (Array.isArray(operacoesRaw) && operacoesRaw.length > 0) {
        store.limparDados();
        const operacoes = operacoesRaw.map((op) => ({
          ...op,
          origem: op.origem || "operacao",
        }));
        store.importarDados(JSON.stringify(operacoes));
      }
    } catch (e) {
      console.error("Erro no carregamento inicial:", e);
    }
  }
});

const menuItems = [
  { path: "/", label: "Dashboard", icon: "dashboard" },
  { path: "/operacoes", label: "Operações", icon: "operacoes" },
  { path: "/relatorios", label: "Relatórios", icon: "relatorios" },
  { path: "/admin", label: "Administração", icon: "admin" },
];

const logout = () => {
  store.logout();
  router.push("/login");
};
</script>

<template>
  <div v-if="!isAuthenticated || route.path === '/login'">
    <router-view />
  </div>

  <div v-else class="min-h-screen bg-gray-100 flex">
    <aside class="w-64 bg-[#1e3a5f] text-white flex flex-col">
      <div class="p-4 border-b border-white/10">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <p class="font-bold">CPO</p>
            <p class="text-xs text-white/70">Controle de Operações</p>
          </div>
        </div>
      </div>

      <nav class="flex-1 p-4 space-y-1">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
          :class="route.path === item.path ? 'bg-white/20' : 'hover:bg-white/10'"
        >
          <svg
            v-if="item.icon === 'dashboard'"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
          <svg
            v-else-if="item.icon === 'operacoes'"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <svg
            v-else-if="item.icon === 'importar'"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          <svg
            v-else-if="item.icon === 'relatorios'"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <svg
            v-else-if="item.icon === 'admin'"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="p-4 border-t border-white/10">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span class="text-sm font-medium">{{ store.usuarioAtual?.nome.charAt(0) }}</span>
            </div>
            <div class="text-sm">
              <p class="font-medium">{{ store.usuarioAtual?.nome }}</p>
              <p class="text-xs text-white/70">
                {{ store.usuarioAtual?.perfil.replace("_", " ") }}
              </p>
            </div>
          </div>
          <button @click="logout" class="text-white/70 hover:text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <main class="flex-1 p-8 overflow-auto">
      <router-view />
    </main>
  </div>
</template>

<style>
@media print {
  /* Hide sidebar and reset layout */
  aside {
    display: none !important;
  }
  main {
    padding: 0 !important;
    overflow: visible !important;
  }
  .min-h-screen {
    display: block !important;
  }
  body {
    background: white !important;
    font-size: 11pt;
    color: #111;
  }

  /* Page setup */
  @page {
    size: A4 landscape;
    margin: 15mm 12mm;
  }

  /* Hide interactive elements */
  button,
  .print\:hidden {
    display: none !important;
  }

  /* Show print-only elements */
  .print\:block {
    display: block !important;
  }

  /* Cards */
  .rounded-xl,
  .rounded-lg {
    border-radius: 4px !important;
  }
  .shadow-sm {
    box-shadow: none !important;
  }
  .bg-white {
    background: white !important;
  }
  .border {
    border: 1px solid #d1d5db !important;
  }

  /* Tables */
  table {
    border-collapse: collapse;
    width: 100%;
  }
  th,
  td {
    border: 1px solid #e5e7eb;
    padding: 4px 6px;
    font-size: 9pt;
  }
  thead {
    background-color: #f3f4f6 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Colors */
  .text-\[\#1e3a5f\] {
    color: #1e3a5f !important;
  }
  .bg-\[\#1e3a5f\] {
    background-color: #1e3a5f !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Prevent page breaks inside cards */
  .bg-white {
    break-inside: avoid;
  }

  /* Links */
  a {
    color: #1e3a5f !important;
    text-decoration: none !important;
  }
}
</style>
