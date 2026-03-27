import { useMemo } from 'react'
import { useTransactions } from '@/contexts/TransactionContext'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export function ReconciliationAlert() {
  const { transactions } = useTransactions()

  const discrepancy = useMemo(() => {
    const checkpoints = transactions.filter((t) => t.isCheckpoint)
    if (checkpoints.length === 0) return null

    const sortedCheckpoints = [...checkpoints].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
    )
    const latestCheckpoint = sortedCheckpoints[0]

    const latestDate = new Date(latestCheckpoint.data).getTime()

    const transactionsUpTo = transactions.filter(
      (t) => !t.isCheckpoint && new Date(t.data).getTime() <= latestDate,
    )

    const expectedBalance = transactionsUpTo.reduce(
      (acc, t) => acc + (t.tipo === 'receita' ? t.valor : -t.valor),
      0,
    )
    const reportedBalance =
      latestCheckpoint.tipo === 'despesa' ? -latestCheckpoint.valor : latestCheckpoint.valor

    const difference = expectedBalance - reportedBalance

    return { difference, expectedBalance, reportedBalance, date: latestCheckpoint.data }
  }, [transactions])

  if (!discrepancy) return null

  if (Math.abs(discrepancy.difference) < 0.01) {
    return (
      <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800 mb-6 shadow-sm">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <AlertTitle className="text-emerald-800 font-semibold flex items-center gap-2">
          Saldo Reconciliado
        </AlertTitle>
        <AlertDescription className="text-emerald-700 mt-1">
          O saldo calculado do sistema bate com o último saldo informado (
          {formatCurrency(discrepancy.reportedBalance)}).
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800 mb-6 shadow-sm">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-800 font-semibold">
        Divergência de Saldo Encontrada
      </AlertTitle>
      <AlertDescription className="text-red-700 mt-1">
        Foi encontrada uma divergência de{' '}
        <strong>{formatCurrency(Math.abs(discrepancy.difference))}</strong>. O saldo calculado é{' '}
        {formatCurrency(discrepancy.expectedBalance)}, mas o último saldo informado foi{' '}
        {formatCurrency(discrepancy.reportedBalance)}.
      </AlertDescription>
    </Alert>
  )
}
