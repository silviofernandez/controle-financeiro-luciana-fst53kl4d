import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, Activity, Percent, Scale } from 'lucide-react'
import { formatCurrency } from '@/lib/dashboard-utils'
import { DESPESAS_FIXAS, DESPESAS_VARIAVEIS } from '@/types'

interface SummaryCardsProps {
  transactions: any[]
  prevTransactions: any[]
}

export function SummaryCards({ transactions }: SummaryCardsProps) {
  const calcKPIs = (txs: any[]) => {
    const faturamento = txs
      .filter((t) => t.tipo === 'receita' && !t.isCheckpoint)
      .reduce((acc, t) => acc + (Number(t.valor) || 0), 0)

    const custoFixo = txs
      .filter(
        (t) =>
          t.tipo === 'despesa' &&
          !t.isCheckpoint &&
          (DESPESAS_FIXAS.includes(t.categoria) || t.classificacao === 'fixo'),
      )
      .reduce((acc, t) => acc + (Number(t.valor) || 0), 0)

    const custoVariavelBase = txs
      .filter(
        (t) =>
          t.tipo === 'despesa' &&
          !t.isCheckpoint &&
          (DESPESAS_VARIAVEIS.includes(t.categoria) || t.classificacao === 'variavel'),
      )
      .reduce((acc, t) => acc + (Number(t.valor) || 0), 0)

    const otherCosts = txs
      .filter(
        (t) =>
          t.tipo === 'despesa' &&
          !t.isCheckpoint &&
          !DESPESAS_FIXAS.includes(t.categoria) &&
          !DESPESAS_VARIAVEIS.includes(t.categoria) &&
          t.classificacao !== 'fixo' &&
          t.classificacao !== 'variavel',
      )
      .reduce((acc, t) => acc + (Number(t.valor) || 0), 0)

    const custoVariavel = custoVariavelBase + otherCosts

    const margemContribuicao = faturamento - custoVariavel
    const margemContribuicaoPerc = faturamento > 0 ? (margemContribuicao / faturamento) * 100 : 0
    const pontoEquilibrio =
      margemContribuicaoPerc > 0 ? custoFixo / (margemContribuicaoPerc / 100) : 0
    const resultadoLiquido = faturamento - (custoFixo + custoVariavel)

    return {
      faturamento,
      custoFixo,
      custoVariavel,
      margemContribuicaoPerc,
      pontoEquilibrio,
      resultadoLiquido,
    }
  }

  const data = calcKPIs(transactions)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Card className="border-emerald-100 shadow-sm bg-emerald-50/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-[11px] font-bold text-emerald-800 uppercase">
            Faturamento
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-lg font-bold text-emerald-700">
            {formatCurrency(data.faturamento)}
          </div>
        </CardContent>
      </Card>

      <Card className="border-indigo-100 shadow-sm bg-indigo-50/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-[11px] font-bold text-indigo-800 uppercase">
            Custo Fixo
          </CardTitle>
          <Activity className="h-4 w-4 text-indigo-600" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-lg font-bold text-indigo-700">{formatCurrency(data.custoFixo)}</div>
        </CardContent>
      </Card>

      <Card className="border-amber-100 shadow-sm bg-amber-50/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-[11px] font-bold text-amber-800 uppercase">
            Custo Variável
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-lg font-bold text-amber-700">
            {formatCurrency(data.custoVariavel)}
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-100 shadow-sm bg-blue-50/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-[11px] font-bold text-blue-800 uppercase">
            Margem Contrib.
          </CardTitle>
          <Percent className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-lg font-bold text-blue-700">
            {data.margemContribuicaoPerc.toFixed(1)}%
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-[11px] font-bold text-slate-600 uppercase">
            Ponto Equilíbrio
          </CardTitle>
          <Scale className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-lg font-bold text-slate-700">
            {formatCurrency(data.pontoEquilibrio)}
          </div>
        </CardContent>
      </Card>

      <Card
        className={`shadow-sm border-${data.resultadoLiquido >= 0 ? 'emerald' : 'rose'}-200 bg-${data.resultadoLiquido >= 0 ? 'emerald' : 'rose'}-50/30`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle
            className={`text-[11px] font-bold uppercase text-${data.resultadoLiquido >= 0 ? 'emerald' : 'rose'}-800`}
          >
            Res. Líquido
          </CardTitle>
          <DollarSign
            className={`h-4 w-4 text-${data.resultadoLiquido >= 0 ? 'emerald' : 'rose'}-600`}
          />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div
            className={`text-lg font-bold text-${data.resultadoLiquido >= 0 ? 'emerald' : 'rose'}-700`}
          >
            {formatCurrency(data.resultadoLiquido)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
