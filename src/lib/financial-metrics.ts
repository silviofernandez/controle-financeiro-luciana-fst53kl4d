import { Transaction } from '@/hooks/use-financial-data'
import { parseISO, isSameMonth, subMonths } from 'date-fns'

export interface MonthData {
  revenue: number
  fixed: number
  variable: number
  margin: number
  profit: number
  txs: Transaction[]
}

export function getMonthData(txs: Transaction[], date: Date): MonthData {
  const filtered = txs.filter((t) => isSameMonth(parseISO(t.date), date))
  let revenue = 0,
    fixed = 0,
    variable = 0
  filtered.forEach((t) => {
    if (t.type === 'Receita') revenue += t.amount
    if (t.type === 'Despesa Fixa') fixed += t.amount
    if (t.type === 'Despesa Variável') variable += t.amount
  })
  const margin = revenue - variable
  return { revenue, fixed, variable, margin, profit: margin - fixed, txs: filtered }
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function generateAlerts(txs: Transaction[]) {
  const alerts = []
  const now = new Date()
  const current = getMonthData(txs, now)
  const m1 = getMonthData(txs, subMonths(now, 1))
  const m2 = getMonthData(txs, subMonths(now, 2))
  const m3 = getMonthData(txs, subMonths(now, 3))

  if (current.margin < current.fixed && current.revenue > 0) {
    alerts.push({
      type: 'danger',
      title: 'Risco de Margem',
      message:
        'A margem de contribuição atual não cobre os custos fixos (abaixo do ponto de equilíbrio).',
    })
  }

  if (current.revenue < m1.revenue && m1.revenue < m2.revenue && current.revenue > 0) {
    alerts.push({
      type: 'warning',
      title: 'Queda de Receita',
      message: 'A receita está em declínio há 2 meses consecutivos.',
    })
  }

  const getCatTotals = (monthTxs: Transaction[]) => {
    const totals: Record<string, number> = {}
    monthTxs
      .filter((t) => t.type.includes('Despesa'))
      .forEach((t) => {
        totals[t.category] = (totals[t.category] || 0) + t.amount
      })
    return totals
  }

  const currCats = getCatTotals(current.txs)
  const pastTxs = [...m1.txs, ...m2.txs, ...m3.txs]
  const pastCats: Record<string, number> = {}

  pastTxs
    .filter((t) => t.type.includes('Despesa'))
    .forEach((t) => {
      pastCats[t.category] = (pastCats[t.category] || 0) + t.amount / 3
    })

  for (const [cat, amount] of Object.entries(currCats)) {
    if (pastCats[cat] && pastCats[cat] > 0 && amount > pastCats[cat] * 1.3) {
      alerts.push({
        type: 'destructive',
        title: 'Alerta de Gastos',
        message: `A categoria "${cat}" cresceu mais de 30% em relação à média dos últimos 3 meses.`,
      })
    }
  }

  return alerts
}
