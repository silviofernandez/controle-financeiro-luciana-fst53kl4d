import { useState, useEffect, useMemo } from 'react'
import pb from '@/lib/pocketbase/client'
import { calculateDREData, type DreData } from './dre-utils'
import { DREHeader } from './DREHeader'
import { DRETable } from './DRETable'
import { DRECharts } from './DRECharts'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, TrendingUp, DollarSign, Loader2 } from 'lucide-react'
import type { Transaction } from '@/types'

export default function DRE() {
  const [month, setMonth] = useState(() => (new Date().getMonth() + 1).toString().padStart(2, '0'))
  const [year, setYear] = useState(() => new Date().getFullYear().toString())
  const [isYTD, setIsYTD] = useState(false)
  const [compare, setCompare] = useState('prev_month')
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    pb.collection('transactions')
      .getFullList<Transaction>({ sort: '-created_at' })
      .then((res) => {
        setTxs(res)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const currentDate = useMemo(() => new Date(parseInt(year), parseInt(month) - 1, 1), [month, year])

  const data = useMemo(() => {
    if (!txs.length) return null
    return calculateDREData(txs, currentDate, isYTD, compare)
  }, [txs, currentDate, isYTD, compare])

  const exportExcel = () => {
    if (!data) return
    let csv = `Categoria,Jaú,Pederneiras,Lençóis Paulista,Total,Comparativo (%)\n`
    const addRow = (l: string, r: any) => {
      csv += `"${l}",${r.jau},${r.pederneiras},${r.lencois},${r.total},${r.variance}%\n`
    }
    data.receitas.rows.forEach((r) => addRow(r.label, r))
    addRow('TOTAL RECEITAS', data.receitas.total)
    data.fixas.rows.forEach((r) => addRow(r.label, r))
    addRow('TOTAL DESP FIXAS', data.fixas.total)
    data.variaveis.rows.forEach((r) => addRow(r.label, r))
    addRow('TOTAL DESP VAR', data.variaveis.total)
    addRow('RESULTADO', data.resultado)
    addRow('MARGEM', data.margem)

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `DRE_${month}_${year}.csv`
    link.click()
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  if (!data) return null

  const alerts = []
  if (data.margem.total < 10)
    alerts.push({
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      title: 'Atenção: Margem Baixa',
      text: 'Margem líquida consolidada abaixo de 10%.',
    })
  if (data.fixas.total.total > data.receitas.total.total * 0.6)
    alerts.push({
      icon: DollarSign,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      title: 'Atenção aos Custos Fixos',
      text: 'Despesas fixas representam mais de 60% da receita.',
    })
  const m = data.margem
  const top = Object.entries({
    Jaú: m.jau,
    Pederneiras: m.pederneiras,
    'Lençóis Paulista': m.lencois,
  }).sort((a, b) => b[1] - a[1])[0]
  if (top && top[1] > 0)
    alerts.push({
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
      title: 'Destaque de Performance',
      text: `Unidade ${top[0]} tem a melhor margem (${top[1].toFixed(1)}%).`,
    })

  return (
    <div className="p-6 h-full overflow-y-auto w-full max-w-[1600px] mx-auto bg-slate-50/50">
      <div className="print:hidden">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-6">
          Demonstrativo de Resultados (DRE)
        </h1>
        <DREHeader
          month={month}
          setMonth={setMonth}
          year={year}
          setYear={setYear}
          isYTD={isYTD}
          setIsYTD={setIsYTD}
          compare={compare}
          setCompare={setCompare}
          onExportExcel={exportExcel}
          onExportPDF={() => window.print()}
        />

        {alerts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {alerts.map((a, i) => (
              <Card key={i} className={`${a.bg} border-none shadow-sm`}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={`p-2 rounded-full bg-white/60 ${a.color}`}>
                    <a.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`font-semibold ${a.color}`}>{a.title}</h4>
                    <p className="text-sm text-slate-700 mt-1">{a.text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <DRECharts data={data} />
        <DRETable data={data} />
      </div>

      <div className="hidden print:block absolute top-0 left-0 w-full bg-white text-black p-8">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <img
            src="https://img.usecurling.com/i?q=gabriel&shape=solid-black"
            alt="Gabriel"
            className="h-12 object-contain"
          />
          <div className="text-right">
            <h1 className="text-2xl font-bold">DRE Consolidado</h1>
            <p className="text-gray-600">
              {isYTD ? 'Acumulado ' : 'Mês '}
              {month}/{year}
            </p>
          </div>
        </div>
        <DRETable data={data} />
        <div className="mt-12 text-center text-sm text-gray-500 font-medium">
          Gerado pelo Sistema Confilu
        </div>
      </div>
    </div>
  )
}
