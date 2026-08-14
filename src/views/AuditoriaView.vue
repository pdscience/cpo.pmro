<script setup lang="ts">
import { computed } from 'vue'
import { useOperacaoStore } from '@/stores/operacao'

const store = useOperacaoStore()

const auditoriaOrdenada = computed(() => {
  return [...store.auditoria].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
})

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('pt-BR')
}

const getAcaoColor = (acao: string) => {
  const colors: Record<string, string> = {
    criar: 'bg-green-100 text-green-700',
    editar: 'bg-blue-100 text-blue-700',
    excluir: 'bg-red-100 text-red-700',
    visualizar: 'bg-gray-100 text-gray-700',
    aprobar: 'bg-green-100 text-green-700',
    rejeitar: 'bg-red-100 text-red-700'
  }
  return colors[acao] || 'bg-gray-100 text-gray-700'
}

const getAcaoLabel = (acao: string) => {
  const labels: Record<string, string> = {
    criar: 'Criação',
    editar: 'Edição',
    excluir: 'Exclusão',
    visualizar: 'Visualização',
    aprobar: 'Aprovação',
    rejeitar: 'Rejeição'
  }
  return labels[acao] || acao
}

const getOperacaoNome = (operacaoId: string) => {
  const op = store.operacoes.find(o => o.id === operacaoId)
  return op?.nomeOperacaoApoio || 'Operação não encontrada'
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Trilha de Auditoria</h1>
        <p class="text-gray-500">Registro de todas as ações realizadas no sistema</p>
      </div>
    </div>

    <div class="card card-accent p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-800">Histórico de Ações</h2>
        <span class="text-sm text-gray-500">{{ auditoriaOrdenada.length }} registros</span>
      </div>

      <div v-if="auditoriaOrdenada.length === 0" class="text-center py-12 text-gray-500">
        Nenhuma ação registrada ainda.
      </div>

      <div v-else class="space-y-4">
        <div 
          v-for="registro in auditoriaOrdenada"
          :key="registro.id"
          class="card card-hover p-4"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-full flex items-center justify-center" :class="getAcaoColor(registro.acao)">
                <svg v-if="registro.acao === 'criar'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <svg v-else-if="registro.acao === 'editar'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <svg v-else-if="registro.acao === 'excluir'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <svg v-else-if="registro.acao === 'aprovar'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else-if="registro.acao === 'rejeitar'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span :class="getAcaoColor(registro.acao)" class="px-2 py-0.5 rounded-full text-xs font-medium">
                    {{ getAcaoLabel(registro.acao) }}
                  </span>
                  <span class="text-sm text-gray-500">{{ formatDateTime(registro.timestamp) }}</span>
                </div>
                <p class="text-sm mt-1">
                  <span class="text-gray-500">Operação:</span>
                  <span class="font-medium text-gray-800"> {{ getOperacaoNome(registro.operacaoId) }}</span>
                </p>
                <p class="text-sm text-gray-500">
                  <span>Usuário: {{ registro.usuarioId }}</span>
                  <span class="mx-2">|</span>
                  <span>IP: {{ registro.ip }}</span>
                </p>
              </div>
            </div>
          </div>

          <div v-if="registro.dadosAnteriores || registro.dadosNovos" class="mt-3 pl-13">
            <details class="text-sm">
              <summary class="cursor-pointer text-[#1e3a5f] hover:text-[#0f2442]">
                Ver detalhes das alterações
              </summary>
              <div class="mt-2 grid grid-cols-2 gap-4">
                <div v-if="registro.dadosAnteriores" class="bg-red-50 p-3 rounded">
                  <p class="font-medium text-red-700 mb-1">Antes</p>
                  <pre class="text-xs overflow-x-auto">{{ JSON.stringify(registro.dadosAnteriores, null, 2) }}</pre>
                </div>
                <div v-if="registro.dadosNovos" class="bg-green-50 p-3 rounded">
                  <p class="font-medium text-green-700 mb-1">Depois</p>
                  <pre class="text-xs overflow-x-auto">{{ JSON.stringify(registro.dadosNovos, null, 2) }}</pre>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
