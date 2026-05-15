import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bill } from '@/types/bills'
import { isSameMonth, parseISO } from 'date-fns'
import { computeBillStatus } from '@/hooks/use-bills'
import { RECEITAS } from '@/types'
import { DollarSign, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react'

export function BillsCards({ bills }: { bills: Bill[] }) {
  const stats = useMemo(() => {
    const now = new Date()
    let totalPagarMes = 0
    let totalVencido = 0
    let totalPagoMes = 0
    let receitas = 0
    let despesas = 0

    bills.forEach((b) => {
      const st = computeBillStatus(b)
      const isThisMonth = isSameMonth(parseISO(b.vencimento), now)
      const isIncome = b.category && RECEITAS.includes(b.category)

      if (st === 'Vencido') {
        totalVencido += b.valor
      }

      if (isThisMonth) {
        if (isIncome) receitas += b.valor
        else despesas += b.valor

        if (b.status !== 'Pago') {
          totalPagarMes += b.valor
        } else {
          totalPagoMes += b.valor
        }
      }
    })

    return {
      totalPagarMes,
      totalVencido,
      totalPagoMes,
      saldoProjetado: receitas - despesas,
    }
  }, [bills])

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            A Pagar este Mês
          </CardTitle>
          <DollarSign className="w-4 h-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalPagarMes)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Vencido</CardTitle>
          <AlertCircle className="w-4 h-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(stats.totalVencido)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pago este Mês</CardTitle>
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalPagoMes)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Saldo Projetado
          </CardTitle>
          <TrendingUp className="w-4 h-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(stats.saldoProjetado)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
