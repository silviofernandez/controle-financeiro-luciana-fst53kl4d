import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Transaction } from '@/hooks/use-financial-data'
import { formatCurrency } from '@/lib/financial-metrics'
import { getYear, parseISO } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function AnnualAnalysis({ transactions }: { transactions: Transaction[] }) {
  const currentYear = getYear(new Date())
  const yearTxs = transactions.filter((t) => getYear(parseISO(t.date)) === currentYear)

  let rev = 0,
    fixed = 0,
    variable = 0
  const cats: Record<string, number> = {}
  const units: Record<string, { rev: number; cost: number }> = {}

  yearTxs.forEach((t) => {
    if (t.type === 'Receita') rev += t.amount
    if (t.type === 'Despesa Fixa') fixed += t.amount
    if (t.type === 'Despesa Variável') variable += t.amount

    if (t.type.includes('Despesa')) {
      cats[t.category] = (cats[t.category] || 0) + t.amount
    }

    if (!units[t.unit]) units[t.unit] = { rev: 0, cost: 0 }
    if (t.type === 'Receita') units[t.unit].rev += t.amount
    if (t.type.includes('Despesa')) units[t.unit].cost += t.amount
  })

  const margin = rev - variable
  const net = margin - fixed

  const topCats = Object.entries(cats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const unitRank = Object.entries(units)
    .map(([unit, data]) => ({
      unit,
      efficiency: data.rev ? ((data.rev - data.cost) / data.rev) * 100 : 0,
    }))
    .sort((a, b) => b.efficiency - a.efficiency)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>DRE Simplificado - {currentYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rubrica</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Receita Bruta</TableCell>
                  <TableCell className="text-right text-green-600 font-medium">
                    {formatCurrency(rev)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>(-) Despesas Variáveis</TableCell>
                  <TableCell className="text-right text-red-500">
                    -{formatCurrency(variable)}
                  </TableCell>
                </TableRow>
                <TableRow className="bg-slate-50">
                  <TableCell className="font-semibold">(=) Margem de Contribuição</TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {formatCurrency(margin)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>(-) Despesas Fixas</TableCell>
                  <TableCell className="text-right text-red-500">
                    -{formatCurrency(fixed)}
                  </TableCell>
                </TableRow>
                <TableRow className="bg-slate-100">
                  <TableCell className="font-bold">(=) Resultado Líquido</TableCell>
                  <TableCell
                    className={`text-right font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatCurrency(net)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Categorias de Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCats.map(([cat, val], i) => (
                <div
                  key={cat}
                  className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-slate-600 font-medium">
                    {i + 1}. {cat}
                  </span>
                  <span className="font-semibold text-slate-800">{formatCurrency(val)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ranking de Eficiência por Unidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unitRank.map((u, i) => (
                <div
                  key={u.unit}
                  className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-slate-600 font-medium">
                    {i + 1}. {u.unit}
                  </span>
                  <div className="text-right">
                    <span className="font-semibold block text-slate-800">
                      {u.efficiency.toFixed(1)}%
                    </span>
                    <span className="text-xs text-slate-400">Margem Líquida</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
