import { useMemo } from 'react'
import { useTransactions } from '@/contexts/TransactionContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
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
} from 'recharts'
import { TrendingUp, ArrowDownRight, ArrowUpRight, Scale } from 'lucide-react'

const COLORS_UNITS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE']

export default function Reports() {
  const { transactions } = useTransactions()

  const { janTotals, febTotals, unitData, classData, barData } = useMemo(() => {
    const getTotals = (prefix: string) => {
      const tx = transactions.filter((t) => t.data.startsWith(prefix) && !t.isCheckpoint)
      const rec = tx.filter((t) => t.tipo === 'receita').reduce((a, b) => a + b.valor, 0)
      const desp = tx.filter((t) => t.tipo === 'despesa').reduce((a, b) => a + b.valor, 0)
      return { receitas: rec, despesas: desp, saldo: rec - desp }
    }

    const jan = getTotals('2026-01')
    const feb = getTotals('2026-02')

    const febDespesas = transactions.filter(
      (t) => t.data.startsWith('2026-02') && t.tipo === 'despesa' && !t.isCheckpoint,
    )

    const byUnit = febDespesas.reduce(
      (acc, t) => {
        acc[t.unidade] = (acc[t.unidade] || 0) + t.valor
        return acc
      },
      {} as Record<string, number>,
    )

    const unitArr = Object.entries(byUnit)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    const fixoTotal = febDespesas
      .filter((t) => t.classificacao === 'fixo')
      .reduce((a, b) => a + b.valor, 0)
    const varTotal = febDespesas
      .filter((t) => t.classificacao === 'variavel')
      .reduce((a, b) => a + b.valor, 0)

    const classArr = [
      { name: 'Custo Fixo', value: fixoTotal, fill: '#6366f1' },
      { name: 'Custo Variável', value: varTotal, fill: '#f59e0b' },
    ].filter((i) => i.value > 0)

    const barComparison = [
      { name: 'Janeiro', receitas: jan.receitas, despesas: jan.despesas },
      { name: 'Fevereiro', receitas: feb.receitas, despesas: feb.despesas },
    ]

    return {
      janTotals: jan,
      febTotals: feb,
      unitData: unitArr,
      classData: classArr,
      barData: barComparison,
    }
  }, [transactions])

  const chartConfigUnits = { value: { label: 'Valor' } }
  const barChartConfig = {
    receitas: { label: 'Receitas', color: '#22C55E' },
    despesas: { label: 'Despesas', color: '#EF4444' },
  }
  const classChartConfig = {
    value: { label: 'Valor' },
    fixo: { label: 'Custo Fixo' },
    variavel: { label: 'Custo Variável' },
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary">Relatórios Comparativos</h2>
        <p className="text-muted-foreground mt-1">
          Análise detalhada de custos fixos, variáveis e evolução mensal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md border-slate-200">
          <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
            <CardTitle className="text-lg text-slate-800">Janeiro 2026</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Receitas</p>
              <p className="text-lg font-bold text-green-600 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" />
                {formatCurrency(janTotals.receitas)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Despesas</p>
              <p className="text-lg font-bold text-red-600 mt-1 flex items-center gap-1">
                <ArrowDownRight className="w-4 h-4" />
                {formatCurrency(janTotals.despesas)}
              </p>
            </div>
            <div className="pl-4 border-l border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase">Saldo</p>
              <p
                className={`text-lg font-bold mt-1 ${janTotals.saldo >= 0 ? 'text-blue-700' : 'text-red-700'}`}
              >
                {formatCurrency(janTotals.saldo)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-blue-100 ring-1 ring-blue-50">
          <CardHeader className="bg-blue-50/30 pb-4 border-b border-blue-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-blue-900">Fevereiro 2026 (Atual)</CardTitle>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Receitas</p>
              <p className="text-lg font-bold text-green-600 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" />
                {formatCurrency(febTotals.receitas)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Despesas</p>
              <p className="text-lg font-bold text-red-600 mt-1 flex items-center gap-1">
                <ArrowDownRight className="w-4 h-4" />
                {formatCurrency(febTotals.despesas)}
              </p>
            </div>
            <div className="pl-4 border-l border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase">Saldo</p>
              <p
                className={`text-lg font-bold mt-1 ${febTotals.saldo >= 0 ? 'text-blue-700' : 'text-red-700'}`}
              >
                {formatCurrency(febTotals.saldo)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-500" /> Custo Fixo vs Variável (Fev)
            </CardTitle>
            <CardDescription>Proporção de gastos classificados neste mês.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {classData.length > 0 ? (
              <ChartContainer config={classChartConfig} className="w-full h-full pb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {classData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={<ChartTooltipContent formatter={(v: number) => formatCurrency(v)} />}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Sem dados classificados
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolução de Entradas e Saídas</CardTitle>
            <CardDescription>Comparativo Jan vs Fev</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ChartContainer config={barChartConfig} className="w-full h-full pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
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
                    maxBarSize={50}
                  />
                  <Bar
                    dataKey="despesas"
                    fill="var(--color-despesas)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Distribuição de Despesas por Unidade (Fev)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {unitData.length > 0 ? (
            <ChartContainer config={chartConfigUnits} className="w-full h-full pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={unitData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {unitData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS_UNITS[index % COLORS_UNITS.length]}
                      />
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
              Nenhuma despesa na unidade
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
