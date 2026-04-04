import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Transaction } from '@/hooks/use-financial-data'
import { getMonthData } from '@/lib/financial-metrics'
import { format, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

export function QuarterlyAnalysis({ transactions }: { transactions: Transaction[] }) {
  const now = new Date()
  const data = [2, 1, 0].map((i) => {
    const d = subMonths(now, i)
    const md = getMonthData(transactions, d)
    return {
      month: format(d, 'MMM', { locale: ptBR }),
      revenue: md.revenue,
      fixed: md.fixed,
      variable: md.variable,
      margin: md.margin,
    }
  })

  const trend = data[2].revenue > data[0].revenue ? 'Crescimento' : 'Queda'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Receitas e Margem</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { label: 'Receita', color: 'hsl(var(--primary))' },
                margin: { label: 'Margem', color: 'hsl(var(--chart-2))' },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="margin"
                    stroke="var(--color-margin)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custos Fixos vs Variáveis</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                fixed: { label: 'Fixo', color: 'hsl(var(--chart-3))' },
                variable: { label: 'Variável', color: 'hsl(var(--chart-4))' },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="fixed" fill="var(--color-fixed)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="variable" fill="var(--color-variable)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ações Prioritárias Recomendadas</CardTitle>
          <CardDescription>
            Baseado na projeção de tendência de {trend.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2 text-slate-700">
            {trend === 'Crescimento' ? (
              <>
                <li>Acelerar investimentos em marketing nas unidades de maior margem.</li>
                <li>Negociar contratos de longo prazo com fornecedores para travar custos.</li>
                <li>Revisar metas de vendas trimestrais para cima.</li>
              </>
            ) : (
              <>
                <li>Auditar top 10 despesas variáveis para cortes imediatos.</li>
                <li>Focar esforço de vendas em produtos/serviços de alto ticket.</li>
                <li>Congelar novas contratações não essenciais.</li>
              </>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
