export type TransactionType = 'receita' | 'despesa'

export type ClassificacaoDespesa = 'fixo' | 'variavel' | null

export type Unidade = 'Jau' | 'Pederneiras' | 'L. Paulista' | 'Silvio' | 'Geral'
export type Banco =
  | 'Santander'
  | 'Inter'
  | 'BTG'
  | 'Caixa'
  | 'Nubank'
  | 'D Financeiro'
  | 'Itaú'
  | 'Neon'
  | 'Outros'

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
  classificacao?: ClassificacaoDespesa
  created_at: string
}

export type RuleValueType = 'percentage' | 'fixed'

export interface RuleVariation {
  id: string
  name: string
  value: number
  type: RuleValueType
}

export interface CommissionRule {
  id: string
  role: string
  variations: RuleVariation[]
}

export interface CommissionTeam {
  id: string
  name: string
  defaultTax: boolean
  defaultLegal: boolean
  rules: CommissionRule[]
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
  'Itaú',
  'Neon',
  'Outros',
]
