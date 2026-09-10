<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useOperacaoStore } from '@/stores/operacao'

const router = useRouter()
const store = useOperacaoStore()

const jsonData = ref('')
const resultado = ref<{ sucesso: number; erros: number } | null>(null)
const erro = ref('')
const loading = ref(false)
const scriptUrl = ref('')
const dadosImportar = ref<Record<string, unknown>[]>([])
const mostrandoDados = ref(false)

const importarJson = () => {
  erro.value = ''
  resultado.value = null
  
  if (!jsonData.value.trim()) {
    erro.value = 'Por favor, cole os dados JSON no campo acima'
    return
  }
  
  try {
    resultado.value = store.importarDados(jsonData.value)
    if (resultado.value.sucesso > 0) {
      setTimeout(() => {
        router.push('/operacoes')
      }, 2000)
    } else {
      erro.value = `Importação concluída! ${resultado.value.sucesso} registro(s) importado(s), ${resultado.value.erros} erro(s).`
    }
  } catch (e) {
    erro.value = 'Erro ao importar. Verifique se o JSON está correto. Copie apenas o texto entre [ e ].'
  }
}

const buscarDadosSheets = async () => {
  erro.value = ''
  loading.value = true
  
  if (!scriptUrl.value.trim()) {
    erro.value = 'Por favor, cole a URL do Apps Script'
    loading.value = false
    return
  }
  
  try {
    const url = scriptUrl.value.trim().replace('/exec', '/exec?action=import')
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'no-cors'
    })
    
    const data = await response.json()
    
    if (data.status === 'success' && data.data) {
      dadosImportar.value = data.data
      mostrandoDados.value = true
      erro.value = ''
    } else {
      erro.value = data.message || 'Erro ao buscar dados'
    }
  } catch (e) {
    erro.value = 'Erro ao conectar. Verifique a URL. O sistema tentou buscar os dados em segundo plano.'
    dadosImportar.value = []
    mostrandoDados.value = true
  } finally {
    loading.value = false
  }
}

const confirmarImportacao = () => {
  if (dadosImportar.value.length === 0) return
  
  let sucesso = 0
  let erros = 0
  
  dadosImportar.value.forEach((item) => {
    try {
      const result = store.importarDados(JSON.stringify([item]))
      if (result.sucesso > 0) {
        sucesso++
      } else {
        erros++
      }
    } catch {
      erros++
    }
  })
  
  resultado.value = { sucesso, erros }
  
  if (sucesso > 0) {
    setTimeout(() => {
      router.push('/operacoes')
    }, 2000)
  }
  
  mostrandoDados.value = false
  dadosImportar.value = []
}

const limparDados = () => {
  if (confirm('Tem certeza que deseja limpar todos os dados atuais?')) {
    store.limparDados()
    resultado.value = null
    jsonData.value = ''
  }
}

const fecharModal = () => {
  mostrandoDados.value = false
  dadosImportar.value = []
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-(--color-text-primary)">Importar Dados</h1>
        <p class="text-(--color-text-muted)">Importe dados de uma planilha Google Sheets</p>
      </div>
      <router-link to="/operacoes" class="text-(--color-text-muted) hover:text-(--color-text-secondary) flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar
      </router-link>
    </div>

    <div class="card card-accent-green p-4">
      <h3 class="font-semibold text-(--color-success) mb-2">Opção 1 - Importar via Interface (Recomendado):</h3>
      <ol class="list-decimal list-inside text-sm text-(--color-success) space-y-1">
        <li>Abra sua planilha no Google Sheets</li>
        <li>Vá em <strong>Extensões → Apps Script</strong></li>
        <li>Copie o código do arquivo <code class="bg-(--color-success)/10 px-1 rounded">docs/importar_planilha_existente.gs</code></li>
        <li>Cole no Apps Script e salve</li>
        <li>Clique em <strong>Publicar → Implantar como API da Web</strong></li>
        <li>Execute como: "Eu" e Acesso: "Qualquer pessoa"</li>
        <li>Na URL gerada, substitua <code>/exec</code> por <code>/exec?action=exportar</code> e abra no navegador</li>
        <li>Clique em "Gerar Dados" e copie o JSON</li>
        <li>Cole o JSON no campo abaixo e clique em "Importar JSON"</li>
      </ol>
    </div>

    <div class="card card-accent-blue p-6">
      <label class="block text-sm font-medium text-(--color-text-secondary) mb-2">
        Cole o JSON aqui:
      </label>
      <textarea 
        v-model="jsonData"
        rows="10"
        class="w-full border border-(--color-border) rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-pmro)/20 focus:border-(--color-pmro) font-mono text-sm"
        placeholder='[{"diaInicio": "2025-01-01", "municipio": "Porto Velho", ...}]'
      ></textarea>
      
      <div v-if="erro" class="mt-2 text-(--color-pmro-danger) text-sm">
        {{ erro }}
      </div>

      <div class="mt-4 flex gap-3">
        <button 
          @click="importarJson"
          class="bg-(--color-pmro) hover:bg-(--color-pmro-blue) text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Importar JSON
        </button>
        
        <button 
          @click="limparDados"
          class="bg-(--color-pmro-danger)/10 hover:bg-(--color-pmro-danger)/20 text-(--color-pmro-danger) px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Limpar Dados
        </button>
      </div>

      <div v-if="resultado" class="mt-4 p-4 bg-(--color-success)/10 border border-(--color-border) rounded-lg">
        <p class="text-(--color-success) font-semibold">
          ✓ Importação concluída!
        </p>
        <p class="text-sm text-(--color-success)">
          {{ resultado.sucesso }} registro(s) importado(s) com sucesso.
          <span v-if="resultado.erros > 0">{{ resultado.erros }} erro(s) encontrado(s).</span>
        </p>
        <p class="text-sm text-(--color-success) mt-1">Redirecionando para listagem...</p>
      </div>
    </div>

    <div v-if="mostrandoDados" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-(--color-surface) rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div class="p-4 border-b border-(--color-border) flex justify-between items-center">
          <h3 class="font-semibold text-lg">Dados Encontrados ({{ dadosImportar.length }} registros)</h3>
          <button @click="fecharModal" class="text-(--color-text-muted) hover:text-(--color-text-secondary)">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-4 overflow-auto max-h-[50vh]">
          <textarea 
            :value="JSON.stringify(dadosImportar, null, 2)"
            rows="15"
            class="w-full border border-(--color-border) rounded-lg px-3 py-2 font-mono text-xs"
            readonly
          ></textarea>
        </div>
        <div class="p-4 border-t border-(--color-border) flex justify-between">
          <p class="text-sm text-(--color-text-muted)">Copie os dados acima e cole no campo JSON abaixo para importar</p>
          <div class="flex gap-2">
            <button @click="fecharModal" class="px-4 py-2 border border-(--color-border) rounded-lg hover:bg-(--color-surface-elevated)">Fechar</button>
            <button @click="confirmarImportacao" class="px-4 py-2 bg-(--color-success) text-white rounded-lg hover:bg-(--color-success)/90">Importar Agora</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
