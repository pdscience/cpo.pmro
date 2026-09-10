<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOperacaoStore } from '@/stores/operacao'
import { apiService } from '@/services/apiGoogleSheets'

const router = useRouter()
const store = useOperacaoStore()

const apiUrl = ref('')
const sincronizando = ref(false)
const mensagem = ref('')
const erro = ref('')

onMounted(() => {
  apiUrl.value = apiService.getApiUrl()
})

const salvarUrl = () => {
  if (!apiUrl.value.trim()) {
    erro.value = 'Por favor, insira a URL da API'
    return
  }
  
  apiService.setApiUrl(apiUrl.value)
  erro.value = ''
  mensagem.value = 'URL salva com sucesso!'
  setTimeout(() => {
    mensagem.value = ''
  }, 3000)
}

const sincronizarDados = async () => {
  if (!apiUrl.value.trim()) {
    erro.value = 'Configure a URL primeiro'
    return
  }
  
  sincronizando.value = true
  erro.value = ''
  mensagem.value = ''
  
  try {
    const operacoes = await apiService.listarOperacoes() as Array<Record<string, unknown>>
    
    if (operacoes.length > 0) {
      store.limparDados()
      
      const resultado = store.importarDados(JSON.stringify(operacoes))
      mensagem.value = `${resultado.sucesso} operações sincronizadas!`
    } else {
      mensagem.value = 'Nenhuma operação encontrada na planilha'
    }
  } catch (e) {
    erro.value = 'Erro ao sincronizar. Verifique a URL e tente novamente.'
    console.error(e)
  } finally {
    sincronizando.value = false
  }
}

const usarDadosLocais = () => {
  router.push('/operacoes')
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-(--color-text-primary)">Configurações da API</h1>
        <p class="text-(--color-text-muted)">Conecte o sistema à planilha Google Sheets</p>
      </div>
      <router-link to="/operacoes" class="text-(--color-text-muted) hover:text-(--color-text-secondary) flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar
      </router-link>
    </div>

    <div class="card card-accent-blue p-4">
      <h3 class="font-semibold text-(--color-pmro-blue) mb-2">Como obter a URL da API:</h3>
      <ol class="list-decimal list-inside text-sm text-(--color-pmro-blue) space-y-1">
        <li>Abra sua planilha no Google Sheets</li>
        <li>Vá em <strong>Extensões → Apps Script</strong></li>
        <li>Copie o código do arquivo <code class="bg-(--color-pmro-blue)/10 px-1 rounded">docs/api_sheets.gs</code></li>
        <li>Cole no Apps Script e salve (Ctrl+S)</li>
        <li>Vá em <strong>Publicar → Implantar como API da Web</strong></li>
        <li>Execute como: <strong>Eu</strong> | Acesso: <strong>Qualquer pessoa</strong></li>
        <li>Copie a <strong>URL</strong> (termina em /exec)</li>
      </ol>
    </div>

    <div class="card card-accent-purple p-6">
      <label class="block text-sm font-medium text-(--color-text-secondary) mb-2">
        URL da API do Google Sheets:
      </label>
      <input 
        v-model="apiUrl"
        type="url" 
        placeholder="https://script.google.com/macros/s/.../exec"
        class="w-full border border-(--color-border) rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-pmro)/20 focus:border-(--color-pmro)"
      />
      
      <div v-if="erro" class="mt-2 text-(--color-pmro-danger) text-sm">
        {{ erro }}
      </div>
      
      <div v-if="mensagem" class="mt-2 text-(--color-success) text-sm">
        {{ mensagem }}
      </div>

      <div class="mt-4 flex gap-3">
        <button 
          @click="salvarUrl"
          class="bg-(--color-pmro) hover:bg-(--color-pmro-blue) text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Salvar URL
        </button>
        
        <button 
          @click="sincronizarDados"
          :disabled="sincronizando"
          class="bg-(--color-success) hover:bg-(--color-success)/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <svg v-if="!sincronizando" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <svg v-else class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ sincronizando ? 'Sincronizando...' : 'Sincronizar Dados' }}
        </button>

        <button 
          @click="usarDadosLocais"
          class="bg-(--color-surface-elevated) hover:bg-(--color-border) text-(--color-text-secondary) px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          Usar Dados Locais
        </button>
      </div>
    </div>

    <div class="bg-(--color-warning)/10 border border-(--color-warning)/20 rounded-lg p-4">
      <h3 class="font-semibold text-(--color-warning) mb-2">Nota Importante:</h3>
      <p class="text-sm text-(--color-warning)">
        A sincronização importa dados da planilha para o sistema. 
        Para salvar alterações de volta na planilha, você precisará usar a função 
        de exportar ou modificar o sistema para enviar alterações automaticamente.
      </p>
    </div>
  </div>
</template>
