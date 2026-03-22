export type TransactionType = 'receita' | 'despesa'

export type Unidade = 'Jau' | 'Pederneiras' | 'L. Paulista' | 'Silvio' | 'Geral'
export type Banco = 'Santander' | 'Inter' | 'BTG' | 'Caixa' | 'Nubank' | 'D Financeiro' | 'Outros'

export interface Transaction {
  id: string
  tipo: TransactionType
  descricao: string
  valor: number
  data: string
  categoria: string
  unidade: Unidade
  banco: Banco
  isCheckpoint?: boolean
  created_at: string
}

export const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Casa',
  'Saúde',
  'Lazer',
  'Trabalho',
  'Impostos',
  'Fornecedores',
  'Folha de Pagamento',
  'Outros',
]

export const UNIDADES: Unidade[] = ['Jau', 'Pederneiras', 'L. Paulista', 'Silvio', 'Geral']

export const BANCOS: Banco[] = [
  'Santander',
  'Inter',
  'BTG',
  'Caixa',
  'Nubank',
  'D Financeiro',
  'Outros',
]
