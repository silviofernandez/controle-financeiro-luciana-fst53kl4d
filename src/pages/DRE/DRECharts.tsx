import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { formatCur } from './dre-utils'
import type { DreData } from './dre-utils'

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#ca8a04', '#9333ea']

export function DRECharts({ data }: { data: DreData }) {
  const barData = [
    {
      name: 'Jaú',
      Receitas: data.receitas.total.jau,
      Despesas: data.fixas.total.jau + data.variaveis.total.jau,
    },
    {
      name: 'Pederneiras',
      Receitas: data.receitas.total.pederneiras,
      Despesas: data.fixas.total.pederneiras + data.variaveis.total.pederneiras,
    },
    {
      name: 'Lençóis',
      Receitas: data.receitas.total.lencois,
      Despesas: data.fixas.total.lencois + data.variaveis.total.lencois,
    },
  ]

  const pieData = [
    { name: 'Fixas', value: data.fixas.total.total },
    { name: 'Variáveis', value: data.variaveis.total.total },
  ]

  const Gauge = ({ value, label }: { value: number; label: string }) => {
    const color = value > 30 ? '#16a34a' : value > 15 ? '#ca8a04' : '#dc2626'
    const chartData = [{ value: Math.max(0, value) }, { value: 100 - Math.max(0, value) }]
    return (
      <div className="flex flex-col items-center">
        <div className="h-24 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="100%"
                startAngle={180}
                endAngle={0}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={color} />
                <Cell fill="#e2e8f0" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div
            className="absolute bottom-0 left-0 w-full text-center font-bold text-xl"
            style={{ color }}
          >
            {value.toFixed(1)}%
          </div>
        </div>
        <span className="text-sm font-medium mt-2 text-slate-600">{label}</span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:hidden">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Receitas vs Despesas (por Unidade)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(val) => `R$ ${val / 1000}k`} />
              <RechartsTooltip formatter={(val: number) => formatCur(val)} />
              <Bar dataKey="Receitas" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesas" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Composição de Despesas</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(val: number) => formatCur(val)} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle className="text-lg">Margem Líquida por Unidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Gauge value={data.margem.jau} label="Jaú" />
            <Gauge value={data.margem.pederneiras} label="Pederneiras" />
            <Gauge value={data.margem.lencois} label="Lençóis Paulista" />
            <Gauge value={data.margem.total} label="Total Consolidado" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
