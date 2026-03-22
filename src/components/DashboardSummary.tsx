import { useTransactions } from '@/contexts/TransactionContext'
import { Card, CardContent } from './ui/card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

export function DashboardSummary() {
  const { transactions } = useTransactions()

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthTransactions = transactions.filter((t) => {
    const d = new Date(t.data)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const receitas = monthTransactions
    .filter((t) => t.tipo === 'receita')
    .reduce((acc, t) => acc + t.valor, 0)
  const despesas = monthTransactions
    .filter((t) => t.tipo === 'despesa')
    .reduce((acc, t) => acc + t.valor, 0)
  const saldo = receitas - despesas

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6">
      <Card className="shadow-md border-green-100 bg-gradient-to-br from-green-50 to-white">
        <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center text-center">
          <TrendingUp className="h-5 w-5 text-green-600 mb-1" />
          <p className="text-[10px] sm:text-xs font-medium text-green-800/70 mb-1 uppercase tracking-wider">
            Receitas
          </p>
          <p className="text-sm sm:text-base font-bold text-green-700">
            {formatCurrency(receitas)}
          </p>
        </CardContent>
      </Card>
      <Card className="shadow-md border-red-100 bg-gradient-to-br from-red-50 to-white">
        <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center text-center">
          <TrendingDown className="h-5 w-5 text-red-500 mb-1" />
          <p className="text-[10px] sm:text-xs font-medium text-red-800/70 mb-1 uppercase tracking-wider">
            Despesas
          </p>
          <p className="text-sm sm:text-base font-bold text-red-600">{formatCurrency(despesas)}</p>
        </CardContent>
      </Card>
      <Card className="shadow-md border-blue-100 bg-gradient-to-br from-blue-50 to-white">
        <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center text-center">
          <DollarSign className="h-5 w-5 text-blue-600 mb-1" />
          <p className="text-[10px] sm:text-xs font-medium text-blue-800/70 mb-1 uppercase tracking-wider">
            Saldo
          </p>
          <p
            className={`text-sm sm:text-base font-bold ${saldo >= 0 ? 'text-blue-700' : 'text-red-600'}`}
          >
            {formatCurrency(saldo)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
