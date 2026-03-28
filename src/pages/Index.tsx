import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, FileText, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { useToast } from '@/hooks/use-toast'

const mockChartData = [
  { month: 'Out', receitas: 45000, despesas: 32000 },
  { month: 'Nov', receitas: 52000, despesas: 38000 },
  { month: 'Dez', receitas: 61000, despesas: 42000 },
  { month: 'Jan', receitas: 58000, despesas: 39000 },
  { month: 'Fev', receitas: 49000, despesas: 35000 },
  { month: 'Mar', receitas: 65000, despesas: 41000 },
]

const summaryData = {
  balance: 24000,
  revenue: 65000,
  expenses: 41000,
  balanceChange: '+12%',
  revenueChange: '+8%',
  expensesChange: '-2%',
}

export default function Index() {
  const { toast } = useToast()

  const handleExportExcel = () => {
    toast({
      title: 'Exportação Concluída',
      description: 'O arquivo Excel (CSV) está sendo baixado.',
    })

    setTimeout(() => {
      const csvContent =
        'data:text/csv;charset=utf-8,Mês,Receitas,Despesas\n' +
        mockChartData.map((e) => `${e.month},${e.receitas},${e.despesas}`).join('\n')
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', 'relatorio_financeiro.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }, 500)
  }

  const handleExportPDF = () => {
    toast({
      title: 'Exportação PDF',
      description: 'Preparando documento para impressão e salvamento em PDF.',
    })
    setTimeout(() => {
      window.print()
    }, 500)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Financeiro</h1>
          <p className="text-slate-500 mt-1">Visão geral e tendências dos últimos 6 meses.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportExcel} className="gap-2 bg-white">
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
          <Button onClick={handleExportPDF} className="gap-2">
            <FileText className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                summaryData.balance,
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-medium">{summaryData.balanceChange}</span>
              <span>vs. mês anterior</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                summaryData.revenue,
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-medium">{summaryData.revenueChange}</span>
              <span>vs. mês anterior</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
            <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                summaryData.expenses,
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-rose-600 font-medium">{summaryData.expensesChange}</span>
              <span>vs. mês anterior</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4 border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Receitas vs Despesas</CardTitle>
          <CardDescription>Comparativo dos últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              receitas: {
                label: 'Receitas',
                color: 'hsl(var(--primary))',
              },
              despesas: {
                label: 'Despesas',
                color: 'hsl(var(--destructive))',
              },
            }}
            className="h-[400px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--foreground))' }}
                  dy={10}
                />
                <YAxis
                  tickFormatter={(value) => `R$ ${value / 1000}k`}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--foreground))' }}
                  dx={-10}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
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
  )
}
