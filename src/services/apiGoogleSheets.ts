const API_URL_KEY = 'cpo_api_url'

export const apiService = {
  getApiUrl(): string {
    return localStorage.getItem(API_URL_KEY) || ''
  },

  setApiUrl(url: string) {
    localStorage.setItem(API_URL_KEY, url)
  },

  async listarOperacoes(): Promise<unknown[]> {
    const url = this.getApiUrl()
    if (!url) return []

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: new URLSearchParams({ action: 'list' })
      })
      const data = await response.json()
      if (data.status === 'success') {
        return data.data || []
      }
      return []
    } catch (error) {
      console.error('Erro ao buscar operações:', error)
      return []
    }
  },

  async buscarOperacao(id: string): Promise<unknown | null> {
    const url = this.getApiUrl()
    if (!url) return null

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: new URLSearchParams({ action: 'get', id })
      })
      const data = await response.json()
      if (data.status === 'success') {
        return data.data
      }
      return null
    } catch (error) {
      console.error('Erro ao buscar operação:', error)
      return null
    }
  },

  async criarOperacao(operacao: Record<string, unknown>): Promise<boolean> {
    const url = this.getApiUrl()
    if (!url) return false

    try {
      const response = await fetch(`${url}?action=create`, {
        method: 'POST',
        body: new URLSearchParams({
          data: JSON.stringify(operacao)
        })
      })
      const data = await response.json()
      return data.status === 'success'
    } catch (error) {
      console.error('Erro ao criar operação:', error)
      return false
    }
  },

  async atualizarOperacao(id: string, operacao: Record<string, unknown>): Promise<boolean> {
    const url = this.getApiUrl()
    if (!url) return false

    try {
      const response = await fetch(`${url}?action=update&id=${id}`, {
        method: 'POST',
        body: new URLSearchParams({
          data: JSON.stringify(operacao)
        })
      })
      const data = await response.json()
      return data.status === 'success'
    } catch (error) {
      console.error('Erro ao atualizar operação:', error)
      return false
    }
  },

  async excluirOperacao(id: string): Promise<boolean> {
    const url = this.getApiUrl()
    if (!url) return false

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: new URLSearchParams({ action: 'delete', id })
      })
      const data = await response.json()
      return data.status === 'success'
    } catch (error) {
      console.error('Erro ao excluir operação:', error)
      return false
    }
  },

  async sincronizar(operacoes: Record<string, unknown>[]): Promise<{ success: boolean; total?: number; message?: string }> {
    const url = this.getApiUrl()
    if (!url) return { success: false, message: 'URL da API não configurada' }

    try {
      const response = await fetch(`${url}?action=sync`, {
        method: 'POST',
        body: new URLSearchParams({
          data: JSON.stringify(operacoes)
        })
      })
      const data = await response.json()
      return {
        success: data.status === 'success',
        total: data.total,
        message: data.message
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error)
      return { success: false, message: String(error) }
    }
  }
}
