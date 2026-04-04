import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Transaction } from '@/hooks/use-financial-data'
import { getMonthData, formatCurrency } from '@/lib/financial-metrics'
import { format, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MonthlyAnalysis({ transactions }: { transactions: Transaction[] }) {
  const now = new Date()
  const current = getMonthData(transactions, now)
  const prev = getMonthData(transactions, subMonths(now, 1))
  const monthName = format(now, 'MMMM/yyyy', { locale: ptBR })

  const revDiff = current.revenue - prev.revenue
  const revPerc = prev.revenue ? (revDiff / prev.revenue) * 100 : 0

  const topExpenses = current.txs
    .filter((t) => t.type.includes('Despesa'))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumo Executivo - {monthName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 leading-relaxed">
            Em <span className="capitalize">{monthName}</span>, a empresa apresentou uma{' '}
            {revDiff >= 0 ? 'evolução' : 'retração'} de{' '}
            <strong className={revDiff >= 0 ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(revPerc).toFixed(1)}%
            </strong>{' '}
            nas receitas em relação ao mês anterior. Os custos fixos totalizaram{' '}
            {formatCurrency(current.fixed)}, enquanto as despesas variáveis foram de{' '}
            {formatCurrency(current.variable)}. A margem de contribuição fechou em{' '}
            {formatCurrency(current.margin)}, indicando que a operação está{' '}
            {current.margin >= current.fixed
              ? 'saudável e cobrindo os custos fixos'
              : 'em alerta, não cobrindo o ponto de equilíbrio'}
            .
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Receita" value={current.revenue} prev={prev.revenue} />
        <MetricCard title="Despesa Fixa" value={current.fixed} prev={prev.fixed} inverse />
        <MetricCard
          title="Despesa Variável"
          value={current.variable}
          prev={prev.variable}
          inverse
        />
        <MetricCard title="Margem de Contribuição" value={current.margin} prev={prev.margin} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 5 Maiores Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topExpenses.map((t) => (
              <div
                key={t.id}
                className="flex justify-between items-center border-b pb-2 last:border-0"
              >
                <div>
                  <p className="font-medium text-sm">{t.description}</p>
                  <p className="text-xs text-slate-500">
                    {t.category} • {t.unit}
                  </p>
                </div>
                <span className="font-semibold text-sm">{formatCurrency(t.amount)}</span>
              </div>
            ))}
            {topExpenses.length === 0 && (
              <p className="text-sm text-slate-500">Nenhuma despesa registrada.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  title,
  value,
  prev,
  inverse = false,
}: {
  title: string
  value: number
  prev: number
  inverse?: boolean
}) {
  const diff = value - prev
  const perc = prev ? (diff / prev) * 100 : 0
  const isPositive = inverse ? diff <= 0 : diff >= 0
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <DollarSign className="h-4 w-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCurrency(value)}</div>
        <p className="text-xs text-slate-500 flex items-center mt-1">
          <span
            className={cn(
              'flex items-center mr-1 font-medium',
              isPositive ? 'text-green-600' : 'text-red-600',
            )}
          >
            {diff >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {Math.abs(perc).toFixed(1)}%
          </span>
          vs mês anterior
        </p>
      </CardContent>
    </Card>
  )
}
