export type TransactionType = 'receita' | 'despesa'

export type ClassificacaoDespesa = 'fixo' | 'variavel' | null
export type ReceitaTipo = 'comissao' | 'outro'
export type DespesaTipo = 'unitaria' | 'cia'

export type Unidade =
  | 'Jau'
  | 'Pederneiras'
  | 'L. Paulista'
  | 'Pró-labore (Silvio/Luciana)'
  | 'Geral'
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

export type BrokerLevel = 'Júnior' | 'Pleno' | 'Sênior' | string

export type CollaboratorRole =
  | 'Corretor'
  | 'Gerente de Equipe'
  | 'Gerente Geral'
  | 'Apoio'
  | 'Captador'

export interface Broker {
  id: string
  role?: CollaboratorRole | string
  name: string
  level: BrokerLevel
  percentage: number
}

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
  receitaTipo?: ReceitaTipo
  despesaTipo?: DespesaTipo
  corretor?: string
  corretorNivel?: string
  corretorPorcentagem?: number
  captador?: string
  captadorNivel?: string
  captadorPorcentagem?: number
  notaFiscal?: boolean
  juridico?: boolean
  juridicoValor?: number
  equipe?: string
  observacoes?: string
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
  taxPercentage?: number
  legalValue?: number
  rules: CommissionRule[]
}

export const RECEITAS = [
  'Aluguel',
  'Comissões Vendas',
  'Taxa Adm Locação',
  'Taxa Contrato Locação',
  'Taxa Comissão Seguros',
  'Multa por Atraso',
  'Juros por Atraso',
  'Antecipação de Aluguel',
  'Acordos e Distrato',
  'Atualização Monetária',
  'Manutenção Cobrada',
  'Seguro Fiança',
  'Taxa de Emissão',
  'Honorários AdmFin',
  'Honorários Advocatícios',
  'Custas Judiciais',
  'Água Imóveis',
  'Condomínio',
  'Energia Imóveis',
  'Estacionamento Convênio',
  'Rendimentos Aplicação',
  'Outros Créditos',
]

export const DESPESAS_FIXAS = [
  'Folha - Administrativo',
  'Folha - Locação',
  'Folha - Vendas',
  'Folha - Lençóis',
  'Folha - Pederneiras',
  'Pró-labore',
  'Segurança do Trabalho',
  'FGTS e Rescisões',
  'Adiantamentos de Salário',
  'Aluguel Prédio',
  'Energia Prédio',
  'Água Prédio',
  'Estacionamento Empresa',
  'Internet',
  'Telefonia Fixa',
  'Telefonia Móvel',
  'E-mail e Hospedagem',
  'Sistemas e Software',
  'Honorários Contábeis',
  'Manutenção Equipamentos',
  'Manutenção Sistemas',
]

export const DESPESAS_VARIAVEIS = [
  'Comissões Pagas Vendas',
  'Comissão Gerência',
  'IRRF PJ',
  'ISSQN',
  'Simples Nacional',
  'Parcelamento Simples',
  'Simples Nacional Parcelado',
  'IR',
  'ITBI e Empreendimentos',
  'Combustível Vendas',
  'Combustível Locação',
  'Combustível Pederneiras',
  'Combustível Lençóis',
  'Viagens e Estadias',
  'Tarifas Bancárias',
  'Tarifa DOC/TED',
  'Multa e Juros Bancários',
  'Taxa Boleto',
  'Acordos e Parcelamentos',
  'Marketing Digital',
  'Marketing Impresso',
  'Serviços Terceiros',
  'Manutenções Imóveis',
  'Empréstimo e Financiamento',
  'Aquisição Ativo',
  'Outros Débitos',
]

export const CATEGORIES = [...RECEITAS, ...DESPESAS_FIXAS, ...DESPESAS_VARIAVEIS]

export const UNIDADES: Unidade[] = [
  'Jau',
  'Pederneiras',
  'L. Paulista',
  'Pró-labore (Silvio/Luciana)',
  'Geral',
]

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
