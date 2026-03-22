import { useMemo } from 'react'
import { useTransactions } from '@/contexts/TransactionContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { formatCurrency } from '@/lib/utils'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import { AlertTriangle, TrendingUp } from 'lucide-react'

const COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE', '#1D4ED8']

export default function Reports() {
  const { transactions } = useTransactions()

  const pieData = useMemo(() => {
    const expenses = transactions.filter((t) => t.tipo === 'despesa' && !t.isCheckpoint)
    const byUnit = expenses.reduce(
      (acc, t) => {
        acc[t.unidade] = (acc[t.unidade] || 0) + t.valor
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(byUnit)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transactions])

  const chartConfig = {
    value: { label: 'Valor' },
  }

  // Simplified Mock Data for the 6-month trend since we might not have enough real data
  const monthlyData = [
    { name: 'Mai', receitas: 185000, despesas: 162000 },
    { name: 'Jun', receitas: 285000, despesas: 259000 },
    { name: 'Jul', receitas: 290000, despesas: 271000 },
    { name: 'Ago', receitas: 285000, despesas: 268000 },
    { name: 'Set', receitas: 285000, despesas: 281000 },
    { name: 'Out', receitas: 300000, despesas: 250700 },
  ]

  const barChartConfig = {
    receitas: { label: 'Receitas', color: '#22C55E' },
    despesas: { label: 'Despesas', color: '#EF4444' },
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary">Relatórios e Análises</h2>
        <p className="text-muted-foreground mt-1">Visualize seus padrões de gastos e receitas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md border-blue-100/50">
          <CardHeader className="bg-gradient-to-r from-white to-blue-50/50 pb-4">
            <CardTitle className="text-lg">Despesas por Unidade</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] pt-6">
            {pieData.length > 0 ? (
              <ChartContainer config={chartConfig} className="w-full h-full pb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={<ChartTooltipContent formatter={(v: number) => formatCurrency(v)} />}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Nenhuma despesa registrada
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md border-blue-100/50">
          <CardHeader className="bg-gradient-to-r from-white to-blue-50/50 pb-4">
            <CardTitle className="text-lg">Receitas vs Despesas (6 meses)</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] pt-6">
            <ChartContainer config={barChartConfig} className="w-full h-full pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    dy={10}
                  />
                  <YAxis hide />
                  <ChartTooltip
                    cursor={{ fill: 'transparent' }}
                    content={<ChartTooltipContent formatter={(v: number) => formatCurrency(v)} />}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar
                    dataKey="receitas"
                    fill="var(--color-receitas)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="despesas"
                    fill="var(--color-despesas)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-sm border-orange-200 bg-gradient-to-br from-orange-50/80 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Alerta de Gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-700 leading-relaxed">
              Os custos da unidade <strong>Jau</strong> representam a maior parte de suas despesas.
              Considere revisar o orçamento operacional.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-green-200 bg-gradient-to-br from-green-50/80 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-green-800">
              <TrendingUp className="h-5 w-5" />
              Meta Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700 leading-relaxed">
              O Saldo Geral está positivo! Você conseguiu manter o fluxo de caixa saudável entre as
              unidades.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
