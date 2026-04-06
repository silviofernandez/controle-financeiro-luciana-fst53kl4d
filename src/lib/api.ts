export const BASE_URL = 'http://173.212.241.213:3010'

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token') || localStorage.getItem('pocketbase_auth')

  if (!token) return {}

  try {
    const parsed = JSON.parse(token)
    if (parsed && parsed.token) {
      return { Authorization: `Bearer ${parsed.token}` }
    }
  } catch (e) {
    // If token is a plain string, not JSON
  }

  return { Authorization: `Bearer ${token}` }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers as Record<string, string>),
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorMessage = `API error: ${response.status} ${response.statusText}`
    try {
      const errorData = await response.json()
      if (errorData && errorData.message) {
        errorMessage = errorData.message
      }
    } catch (_) {
      // Ignore JSON parse error if body is not JSON
    }
    throw new Error(errorMessage)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

export interface LancamentoPayload {
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa_fixa' | 'despesa_variavel'
  data_lancamento: string
  unidade_id: string
  categoria_id: string
  competencia?: string
  observacao?: string
}

export const api = {
  lancamentos: {
    listar: () => request<any[]>('/lancamentos', { method: 'GET' }),
    criar: (data: LancamentoPayload) =>
      request<any>('/lancamentos', { method: 'POST', body: JSON.stringify(data) }),
    atualizar: (id: string, data: Partial<LancamentoPayload>) =>
      request<any>(`/lancamentos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    excluir: (id: string) => request<void>(`/lancamentos/${id}`, { method: 'DELETE' }),
  },
  categorias: {
    listarCategorias: () => request<any[]>('/categorias', { method: 'GET' }),
  },
  unidades: {
    listarUnidades: () => request<any[]>('/unidades', { method: 'GET' }),
  },
  relatorios: {
    getRelatorioDRE: () => request<any>('/relatorios/dre', { method: 'GET' }),
    getRelatorioResumoGeral: () => request<any>('/relatorios/resumoGeral', { method: 'GET' }),
  },
}
