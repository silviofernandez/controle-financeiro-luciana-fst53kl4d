import {
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  startOfYear,
  subMonths,
  subYears,
  parseISO,
} from 'date-fns'
import type { Transaction } from '@/types'

export type DreRow = {
  label: string
  jau: number
  pederneiras: number
  lencois: number
  total: number
  compTotal: number
  variance: number
}
export type DreSection = { rows: DreRow[]; total: DreRow }
export type DreData = {
  receitas: DreSection
  fixas: DreSection
  variaveis: DreSection
  resultado: DreRow
  margem: DreRow
}

export const formatCur = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
export const formatPct = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1 }).format(v / 100)

const initRow = (label: string): DreRow => ({
  label,
  jau: 0,
  pederneiras: 0,
  lencois: 0,
  total: 0,
  compTotal: 0,
  variance: 0,
})

function classify(category: string, type: string) {
  const cat = category.toLowerCase()
  if (type === 'Receita') {
    if (cat.includes('comissões vendas') || cat.includes('comissoes vendas'))
      return 'Comissões Vendas'
    if (cat.includes('taxa adm locaç')) return 'Taxa Adm Locação'
    if (cat.includes('taxa contrato')) return 'Taxa Contrato Locação'
    return 'Outros Créditos'
  }
  if (type === 'Despesa Fixa') {
    if (cat.includes('folha') || cat.includes('pró-labore')) return 'Folha de Pagamento'
    if (cat.includes('aluguel')) return 'Aluguel Prédio'
    if (cat.includes('energia') || cat.includes('água')) return 'Energia + Água'
    if (cat.includes('internet') || cat.includes('telefonia')) return 'Internet + Telefonia'
    return 'Outras Despesas Fixas'
  }
  if (cat.includes('comissões pagas') || cat.includes('comissoes pagas'))
    return 'Comissões Pagas Vendas'
  if (cat.includes('marketing')) return 'Marketing Digital'
  if (cat.includes('combustível') || cat.includes('combustivel')) return 'Combustível'
  return 'Outras Despesas Variáveis'
}

const addTxs = (txs: Transaction[], data: Record<string, DreRow>, isComp: boolean) => {
  txs.forEach((t) => {
    const row = classify(t.categoria, t.tipo)
    if (!data[row]) data[row] = initRow(row)
    const val = t.amount || t.valor || 0
    if (isComp) {
      data[row].compTotal += val
    } else {
      data[row].total += val
      if (t.unidade === 'Jaú') data[row].jau += val
      if (t.unidade === 'Pederneiras') data[row].pederneiras += val
      if (t.unidade === 'Lençóis Paulista') data[row].lencois += val
    }
  })
}

const calcVar = (curr: number, comp: number) => {
  if (comp === 0) return curr === 0 ? 0 : curr > 0 ? 100 : -100
  return ((curr - comp) / Math.abs(comp)) * 100
}

export function calculateDREData(
  txs: Transaction[],
  date: Date,
  isYTD: boolean,
  compare: string,
): DreData {
  const cStart = isYTD ? startOfYear(date) : startOfMonth(date)
  const cEnd = endOfMonth(date)
  let pStart = new Date(),
    pEnd = new Date()
  if (compare === 'prev_month') {
    pStart = isYTD ? startOfYear(subMonths(date, 1)) : startOfMonth(subMonths(date, 1))
    pEnd = endOfMonth(subMonths(date, 1))
  } else if (compare === 'prev_year') {
    pStart = isYTD ? startOfYear(subYears(date, 1)) : startOfMonth(subYears(date, 1))
    pEnd = endOfMonth(subYears(date, 1))
  }

  const cTxs = txs.filter((t) =>
    isWithinInterval(parseISO(t.data || t.created_at), { start: cStart, end: cEnd }),
  )
  const pTxs =
    compare !== 'none'
      ? txs.filter((t) =>
          isWithinInterval(parseISO(t.data || t.created_at), { start: pStart, end: pEnd }),
        )
      : []

  const recData: Record<string, DreRow> = {},
    fixData: Record<string, DreRow> = {},
    varData: Record<string, DreRow> = {}
  addTxs(
    cTxs.filter((t) => t.tipo === 'Receita'),
    recData,
    false,
  )
  addTxs(
    cTxs.filter((t) => t.tipo === 'Despesa Fixa'),
    fixData,
    false,
  )
  addTxs(
    cTxs.filter((t) => t.tipo === 'Despesa Variável'),
    varData,
    false,
  )
  addTxs(
    pTxs.filter((t) => t.tipo === 'Receita'),
    recData,
    true,
  )
  addTxs(
    pTxs.filter((t) => t.tipo === 'Despesa Fixa'),
    fixData,
    true,
  )
  addTxs(
    pTxs.filter((t) => t.tipo === 'Despesa Variável'),
    varData,
    true,
  )

  const buildSection = (data: Record<string, DreRow>) => {
    const rows = Object.values(data).map((r) => ({ ...r, variance: calcVar(r.total, r.compTotal) }))
    const total = initRow('TOTAL')
    rows.forEach((r) => {
      total.jau += r.jau
      total.pederneiras += r.pederneiras
      total.lencois += r.lencois
      total.total += r.total
      total.compTotal += r.compTotal
    })
    total.variance = calcVar(total.total, total.compTotal)
    return { rows, total }
  }

  const receitas = buildSection(recData),
    fixas = buildSection(fixData),
    variaveis = buildSection(varData)
  const resultado = initRow('RESULTADO OPERACIONAL')
  const keys = ['jau', 'pederneiras', 'lencois', 'total', 'compTotal'] as const
  keys.forEach((k) => {
    resultado[k] = receitas.total[k] - fixas.total[k] - variaveis.total[k]
  })
  resultado.variance = calcVar(resultado.total, resultado.compTotal)

  const margem = initRow('MARGEM LÍQUIDA (%)')
  keys.forEach((k) => {
    margem[k] = receitas.total[k] ? (resultado[k] / receitas.total[k]) * 100 : 0
  })
  margem.variance = margem.total - margem.compTotal

  return { receitas, fixas, variaveis, resultado, margem }
}
