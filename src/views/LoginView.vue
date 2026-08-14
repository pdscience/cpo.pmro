<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useOperacaoStore } from "@/stores/operacao";

const router = useRouter();
const store = useOperacaoStore();

const email = ref("");
const senha = ref("");
const erro = ref("");
const loading = ref(false);

async function login() {
  erro.value = "";

  if (!email.value || !senha.value) {
    erro.value = "Por favor, preencha o email e a senha";
    return;
  }

  loading.value = true;

  const resultado = store.login(email.value, senha.value);

  if (resultado.sucesso) {
    router.push("/");
  } else {
    erro.value = resultado.erro || "Erro ao fazer login";
  }

  loading.value = false;
}
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#0f2442] flex items-center justify-center p-4"
  >
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
      <div class="bg-[#1e3a5f] p-8 text-center">
        <div
          class="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-white">CPO - Controle de Operações</h1>
        <p class="text-white/70 mt-2">Faça login para continuar</p>
      </div>

      <div class="p-8">
        <form @submit.prevent="login" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2"> Email </label>
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#1e3a5f] focus:outline-none transition-colors"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label for="senha" class="block text-sm font-medium text-gray-700 mb-2"> Senha </label>
            <input
              id="senha"
              v-model="senha"
              type="password"
              autocomplete="current-password"
              required
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#1e3a5f] focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div
            v-if="erro"
            class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
          >
            {{ erro }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-[#1e3a5f] hover:bg-[#0f2442] disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {{ loading ? "Entrando..." : "Entrar no Sistema" }}
          </button>
        </form>

        <div class="mt-6 pt-6 border-t border-gray-200">
          <p class="text-xs text-gray-500 text-center">
            Credenciais de acesso fornecidas pela administração do sistema.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
