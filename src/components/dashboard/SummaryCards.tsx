import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SummaryCardsProps {
  transactions: any[]
  prevTransactions?: any[]
  isLoading?: boolean
}

export function SummaryCards({ transactions, isLoading }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-[140px] w-full rounded-xl" />
        <Skeleton className="h-[140px] w-full rounded-xl" />
        <Skeleton className="h-[140px] w-full rounded-xl" />
      </div>
    )
  }

  const receitas = transactions
    .filter((t) => t.tipo === 'receita')
    .reduce((acc, t) => acc + (Number(t.valor) || 0), 0)

  const despesas = transactions
    .filter((t) => t.tipo === 'despesa_fixa' || t.tipo === 'despesa_variavel')
    .reduce((acc, t) => acc + (Number(t.valor) || 0), 0)

  const resultado = receitas - despesas

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const isPositive = resultado >= 0

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-emerald-100 shadow-sm bg-emerald-50/30 transition-colors hover:bg-emerald-50/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-semibold text-emerald-800 uppercase tracking-wider">
            Receitas
          </CardTitle>
          <div className="p-2 bg-emerald-100 rounded-full">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-3xl font-bold text-emerald-700 tracking-tight">
            {formatCurrency(receitas)}
          </div>
        </CardContent>
      </Card>

      <Card className="border-rose-100 shadow-sm bg-rose-50/30 transition-colors hover:bg-rose-50/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-semibold text-rose-800 uppercase tracking-wider">
            Despesas
          </CardTitle>
          <div className="p-2 bg-rose-100 rounded-full">
            <TrendingDown className="h-4 w-4 text-rose-600" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-3xl font-bold text-rose-700 tracking-tight">
            {formatCurrency(despesas)}
          </div>
        </CardContent>
      </Card>

      <Card
        className={cn(
          'shadow-sm transition-colors',
          isPositive
            ? 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/50'
            : 'border-rose-200 bg-rose-50/30 hover:bg-rose-50/50',
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle
            className={cn(
              'text-sm font-semibold uppercase tracking-wider',
              isPositive ? 'text-emerald-800' : 'text-rose-800',
            )}
          >
            Resultado
          </CardTitle>
          <div className={cn('p-2 rounded-full', isPositive ? 'bg-emerald-100' : 'bg-rose-100')}>
            <DollarSign
              className={cn('h-4 w-4', isPositive ? 'text-emerald-600' : 'text-rose-600')}
            />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div
            className={cn(
              'text-3xl font-bold tracking-tight',
              isPositive ? 'text-emerald-700' : 'text-rose-700',
            )}
          >
            {formatCurrency(resultado)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
