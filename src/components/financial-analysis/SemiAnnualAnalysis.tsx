import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Transaction } from '@/hooks/use-financial-data'
import { formatCurrency } from '@/lib/financial-metrics'
import { getMonth, parseISO, getYear } from 'date-fns'

export function SemiAnnualAnalysis({ transactions }: { transactions: Transaction[] }) {
  const currentYear = getYear(new Date())
  const yearTxs = transactions.filter((t) => getYear(parseISO(t.date)) === currentYear)

  let h1Rev = 0,
    h2Rev = 0,
    h1Fixed = 0,
    h2Fixed = 0,
    h1Var = 0,
    h2Var = 0

  yearTxs.forEach((t) => {
    const m = getMonth(parseISO(t.date))
    const isH1 = m < 6
    if (t.type === 'Receita') isH1 ? (h1Rev += t.amount) : (h2Rev += t.amount)
    if (t.type === 'Despesa Fixa') isH1 ? (h1Fixed += t.amount) : (h2Fixed += t.amount)
    if (t.type === 'Despesa Variável') isH1 ? (h1Var += t.amount) : (h2Var += t.amount)
  })

  const h1Margin = h1Rev - h1Var
  const h2Margin = h2Rev - h2Var

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Revisão Semestral Estratégica - {currentYear}</CardTitle>
          <CardDescription>
            Análise comparativa entre o 1º Semestre (Jan-Jun) e 2º Semestre (Jul-Dez)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-slate-800">1º Semestre (H1)</h3>
              <div className="bg-slate-50 p-4 rounded-lg space-y-2 border">
                <div className="flex justify-between text-sm">
                  <span>Receita:</span> <span className="font-medium">{formatCurrency(h1Rev)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Ponto de Equilíbrio (Fixos):</span>{' '}
                  <span className="font-medium text-amber-600">{formatCurrency(h1Fixed)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span>Margem de Contribuição:</span>{' '}
                  <span className="font-bold text-primary">{formatCurrency(h1Margin)}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-slate-800">2º Semestre (H2)</h3>
              <div className="bg-slate-50 p-4 rounded-lg space-y-2 border">
                <div className="flex justify-between text-sm">
                  <span>Receita:</span> <span className="font-medium">{formatCurrency(h2Rev)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Ponto de Equilíbrio (Fixos):</span>{' '}
                  <span className="font-medium text-amber-600">{formatCurrency(h2Fixed)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span>Margem de Contribuição:</span>{' '}
                  <span className="font-bold text-primary">{formatCurrency(h2Margin)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t mt-4">
            <h4 className="font-semibold text-md mb-3">
              Análise de Sazonalidade (Mercado Imobiliário)
            </h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              O {h1Rev > h2Rev ? '1º semestre' : '2º semestre'} apresentou um volume superior de
              receitas. No setor imobiliário, isso geralmente reflete{' '}
              {h1Rev > h2Rev
                ? 'a alta temporada de locações estudantis e renovações características de início de ano'
                : 'o fechamento de vendas acumuladas no fim do ano e recebimento de comissões mais expressivas'}
              . O ponto de equilíbrio {h2Fixed > h1Fixed ? 'aumentou' : 'reduziu'} no H2, exigindo
              atenção contínua na gestão de custos fixos para manter a margem de contribuição
              saudável.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
