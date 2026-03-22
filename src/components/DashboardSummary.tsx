import { useTransactions } from '@/contexts/TransactionContext'
import { Card, CardContent } from './ui/card'
import { formatCurrency } from '@/lib/utils'
import { Building2, Wallet, Landmark } from 'lucide-react'

export function DashboardSummary() {
  const { transactions } = useTransactions()

  const calculateUnitTotal = (unit: string) => {
    return transactions
      .filter((t) => t.unidade === unit && t.tipo === 'despesa' && !t.isCheckpoint)
      .reduce((acc, t) => acc + t.valor, 0)
  }

  const totalJau = calculateUnitTotal('Jau')
  const totalPederneiras = calculateUnitTotal('Pederneiras')
  const totalLPaulista = calculateUnitTotal('L. Paulista')
  const totalSilvio = calculateUnitTotal('Silvio')

  const receitas = transactions
    .filter((t) => t.tipo === 'receita' && !t.isCheckpoint)
    .reduce((acc, t) => acc + t.valor, 0)
  const despesas = transactions
    .filter((t) => t.tipo === 'despesa' && !t.isCheckpoint)
    .reduce((acc, t) => acc + t.valor, 0)
  const saldoGeral = receitas - despesas

  const checkpoints = transactions
    .filter((t) => t.isCheckpoint)
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  const lastCheckpoint = checkpoints[0]?.valor || 0

  return (
    <div className="grid grid-cols-2 gap-3 mt-6">
      <Card className="shadow-sm border-slate-200 bg-white">
        <CardContent className="p-3 flex flex-col items-start justify-center">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Jau
          </p>
          <p className="text-sm font-bold text-slate-800">{formatCurrency(totalJau)}</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200 bg-white">
        <CardContent className="p-3 flex flex-col items-start justify-center">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Pederneiras
          </p>
          <p className="text-sm font-bold text-slate-800">{formatCurrency(totalPederneiras)}</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200 bg-white">
        <CardContent className="p-3 flex flex-col items-start justify-center">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> L. Paulista
          </p>
          <p className="text-sm font-bold text-slate-800">{formatCurrency(totalLPaulista)}</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200 bg-white">
        <CardContent className="p-3 flex flex-col items-start justify-center">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Silvio
          </p>
          <p className="text-sm font-bold text-slate-800">{formatCurrency(totalSilvio)}</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-blue-100 bg-blue-50/50">
        <CardContent className="p-3 flex flex-col items-start justify-center">
          <p className="text-[10px] font-medium text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Wallet className="w-3 h-3" /> Saldo Geral
          </p>
          <p className={`text-sm font-bold ${saldoGeral >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
            {formatCurrency(saldoGeral)}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-emerald-100 bg-emerald-50/50">
        <CardContent className="p-3 flex flex-col items-start justify-center">
          <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Landmark className="w-3 h-3" /> Saldo Financeiro (Ref)
          </p>
          <p className="text-sm font-bold text-emerald-700">{formatCurrency(lastCheckpoint)}</p>
        </CardContent>
      </Card>
    </div>
  )
}
