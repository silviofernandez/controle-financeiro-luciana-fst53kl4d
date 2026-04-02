import { useState, useMemo, useEffect } from 'react'
import { useTransactions } from '@/contexts/TransactionContext'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, cn } from '@/lib/utils'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingUp, TrendingDown, Wallet, Download, Filter, FileSpreadsheet } from 'lucide-react'
import { CATEGORIES, UNIDADES, RECEITAS, DESPESAS_FIXAS } from '@/types'
import { toast } from '@/hooks/use-toast'
import { ReconciliationAlert } from '@/components/ReconciliationAlert'

export default function Reports() {
  const { transactions } = useTransactions()
  const [viewMode, setViewMode] = useState<'operacional' | 'dfc'>(() => {
    return (localStorage.getItem('reports_view_mode') as 'operacional' | 'dfc') || 'operacional'
  })

  useEffect(() => {
    localStorage.setItem('reports_view_mode', viewMode)
  }, [viewMode])

  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [unit, setUnit] = useState<string>('all')
  const [category, setCategory] = useState<string>('all')
  const [highlightDate, setHighlightDate] = useState<string | null>(null)

  const handleExport = () => {
    toast({
      title: 'Exportando relatório',
      description: 'O documento está sendo gerado com os filtros atuais.',
    })

    setTimeout(() => {
      const headers = [
        'Data',
        'Descrição',
        'Observação',
        'Categoria',
        'Unidade',
        'Banco',
        'Tipo',
        'Valor',
      ]
      const csvContent = [
        headers.join(','),
        ...filteredTransactions.map((t) => {
          const date = format(new Date(t.data), 'dd/MM/yyyy')
          const desc = `"${(t.descricao || '').replace(/"/g, '""')}"`
          const obs = `"${(t.observacoes || '').replace(/"/g, '""')}"`
          const cat = `"${t.categoria || ''}"`
          const unit = `"${t.unidade || ''}"`
          const banco = `"${t.banco || ''}"`
          const type = t.tipo
          const val = t.valor
          return `${date},${desc},${obs},${cat},${unit},${banco},${type},${val}`
        }),
      ].join('\n')

      const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
        type: 'text/csv;charset=utf-8;',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `relatorio_${viewMode}_${format(new Date(), 'yyyyMMdd')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }, 500)
  }

  const handleAdjustDivergence = (date: string) => {
    setHighlightDate(date)
    setViewMode('operacional')
    setUnit('all')
    setCategory('all')
    setStartDate('')
    setEndDate('')

    setTimeout(() => {
      const tableEl = document.getElementById('transactions-table')
      if (tableEl) {
        tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter((t) => !t.isCheckpoint)

    // Global Filters
    if (unit !== 'all') {
      const unitToMatch = unit === 'Lençóis' ? 'L. Paulista' : unit
      filtered = filtered.filter((t) => {
        if (unitToMatch === 'L. Paulista')
          return t.unidade === 'L. Paulista' || t.unidade === 'Lençóis Paulista'
        if (unitToMatch === 'Jaú') return t.unidade === 'Jau' || t.unidade === 'Jaú'
        return t.unidade === unitToMatch
      })
    }

    if (category !== 'all') {
      filtered = filtered.filter((t) => t.categoria === category)
    }

    if (startDate) {
      try {
        const start = startOfDay(parseISO(startDate)).getTime()
        filtered = filtered.filter((t) => {
          const tTime = parseISO(t.data).getTime()
          return !isNaN(tTime) && tTime >= start
        })
      } catch (e) {
        // Ignore invalid start date
      }
    }

    if (endDate) {
      try {
        const end = endOfDay(parseISO(endDate)).getTime()
        filtered = filtered.filter((t) => {
          const tTime = parseISO(t.data).getTime()
          return !isNaN(tTime) && tTime <= end
        })
      } catch (e) {
        // Ignore invalid end date
      }
    }

    return filtered.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  }, [transactions, unit, category, startDate, endDate])

  const summary = useMemo(() => {
    const entradas = filteredTransactions
      .filter((t) => t.tipo === 'receita')
      .reduce((acc, t) => acc + (Number(t.valor) || 0), 0)

    const saidas = filteredTransactions
      .filter((t) => t.tipo === 'despesa')
      .reduce((acc, t) => acc + (Number(t.valor) || 0), 0)

    const saldo = entradas - saidas

    return { entradas, saidas, saldo }
  }, [filteredTransactions])

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <ReconciliationAlert onAdjust={handleAdjustDivergence} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">
            Central de Relatórios Avançados
          </h2>
          <p className="text-muted-foreground mt-1">Analise o desempenho financeiro da empresa.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-2 hidden sm:inline-block">
              Modo de Visualização:
            </span>
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as 'operacional' | 'dfc')}
              className="w-full sm:w-auto"
            >
              <TabsList className="h-8 w-full sm:w-auto bg-transparent">
                <TabsTrigger
                  value="operacional"
                  className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Modo 1: Visão Operacional
                </TabsTrigger>
                <TabsTrigger
                  value="dfc"
                  className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Modo 2: Visão DFC
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Button
            onClick={handleExport}
            className="whitespace-nowrap shadow-sm bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800 font-medium">
            <Filter className="w-4 h-4 text-primary" /> Filtros Globais
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="start-date"
                className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                Data Inicial
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="end-date"
                className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                Data Final
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Unidade
              </Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Todas as Unidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Unidades</SelectItem>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Categoria
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Todas as Categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'operacional' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total de Entradas
              </CardTitle>
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(summary.entradas)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">Total de Saídas</CardTitle>
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.saidas)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 bg-slate-50/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-800">Saldo do Período</CardTitle>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  'text-2xl font-bold',
                  summary.saldo >= 0 ? 'text-blue-700' : 'text-red-700',
                )}
              >
                {formatCurrency(summary.saldo)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === 'dfc' ? (
        <DfcReport transactions={filteredTransactions} />
      ) : (
        <OperationalView transactions={filteredTransactions} highlightDate={highlightDate} />
      )}
    </div>
  )
}

function OperationalView({
  transactions,
  highlightDate,
}: {
  transactions: any[]
  highlightDate: string | null
}) {
  const sorted = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
  }, [transactions])

  const rows = useMemo(() => {
    let dailyRunningTotal = 0
    let grandTotal = 0
    let jauTotal = 0
    let pederneirasTotal = 0
    let lpaulistaTotal = 0
    let prolaboreTotal = 0

    const result: any[] = []
    let currentDay = ''

    sorted.forEach((t) => {
      const dateObj = new Date(t.data)
      const day = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : ''

      if (currentDay && day !== currentDay) {
        result.push({ type: 'daily_summary', date: currentDay, saldoFinanceiro: dailyRunningTotal })
        dailyRunningTotal = 0
      }
      currentDay = day

      const val = Number(t.valor)
      const signedVal = t.tipo === 'receita' ? val : -val
      dailyRunningTotal += signedVal
      grandTotal += signedVal

      const u = t.unidade
      if (u === 'Jaú' || u === 'Jau') jauTotal += signedVal
      else if (u === 'Pederneiras') pederneirasTotal += signedVal
      else if (u === 'L. Paulista' || u === 'Lençóis Paulista') lpaulistaTotal += signedVal
      else if (u === 'Pró-labore (Silvio/Luciana)') prolaboreTotal += signedVal

      result.push({ type: 'transaction', transaction: t, saldoFinanceiro: dailyRunningTotal })
    })

    if (currentDay) {
      result.push({ type: 'daily_summary', date: currentDay, saldoFinanceiro: dailyRunningTotal })
    }

    result.push({
      type: 'total',
      jau: jauTotal,
      pederneiras: pederneirasTotal,
      lpaulista: lpaulistaTotal,
      prolabore: prolaboreTotal,
      saldoFinanceiro: grandTotal,
    })

    return result
  }, [sorted])

  return (
    <Card
      id="transactions-table"
      className="shadow-sm border-slate-200 overflow-hidden print:shadow-none print:border-none"
    >
      <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100 print:bg-transparent print:border-b-2 print:border-slate-800">
        <CardTitle className="text-lg text-slate-800">Visão Operacional</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[700px] overflow-y-auto relative scroll-smooth print:max-h-none print:overflow-visible">
          <Table>
            <TableHeader className="bg-white sticky top-0 z-10 shadow-sm print:shadow-none print:bg-slate-50">
              <TableRow>
                <TableHead className="w-[100px]">Data</TableHead>
                <TableHead className="text-right min-w-[120px]">Jaú</TableHead>
                <TableHead className="text-right min-w-[120px]">Pederneiras</TableHead>
                <TableHead className="text-right min-w-[120px]">L. Paulista</TableHead>
                <TableHead className="text-right min-w-[120px]">Pró-labore</TableHead>
                <TableHead className="text-right min-w-[140px] font-bold">
                  Saldo Financeiro
                </TableHead>
                <TableHead className="min-w-[120px]">Banco</TableHead>
                <TableHead className="min-w-[200px]">Histórico</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => {
                if (row.type === 'daily_summary') {
                  return (
                    <TableRow
                      key={`summary-${idx}`}
                      className="bg-blue-50 hover:bg-blue-100 font-medium border-y border-blue-100"
                    >
                      <TableCell
                        colSpan={5}
                        className="text-right text-blue-800 text-xs uppercase tracking-wider"
                      >
                        Saldo Diário
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-bold',
                          row.saldoFinanceiro >= 0 ? 'text-blue-700' : 'text-red-700',
                        )}
                      >
                        {formatCurrency(row.saldoFinanceiro)}
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  )
                }

                if (row.type === 'total') {
                  return (
                    <TableRow
                      key={`total-${idx}`}
                      className="bg-slate-800 hover:bg-slate-800 text-white font-bold"
                    >
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.jau)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.pederneiras)}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(row.lpaulista)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.prolabore)}</TableCell>
                      <TableCell
                        className={cn(
                          'text-right',
                          row.saldoFinanceiro >= 0 ? 'text-emerald-400' : 'text-rose-400',
                        )}
                      >
                        {formatCurrency(row.saldoFinanceiro)}
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  )
                }

                const t = row.transaction
                const isHighlighted =
                  highlightDate &&
                  (() => {
                    try {
                      return (
                        new Date(t.data).toISOString().split('T')[0] ===
                        new Date(highlightDate).toISOString().split('T')[0]
                      )
                    } catch {
                      return false
                    }
                  })()

                const isReceita = t.tipo === 'receita'
                const valStr = formatCurrency(Number(t.valor))
                const signedValStr = (isReceita ? '+' : '-') + ' ' + valStr
                const valClass = isReceita ? 'text-emerald-600' : 'text-red-600'

                const u = t.unidade
                const isJau = u === 'Jaú' || u === 'Jau'
                const isPed = u === 'Pederneiras'
                const isLen = u === 'L. Paulista' || u === 'Lençóis Paulista'
                const isPro = u === 'Pró-labore (Silvio/Luciana)'

                return (
                  <TableRow
                    key={t.id}
                    className={cn(
                      'transition-colors',
                      isHighlighted
                        ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500'
                        : 'hover:bg-slate-50/50',
                    )}
                  >
                    <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                      {format(new Date(t.data), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-mono text-sm whitespace-nowrap',
                        isJau && valClass,
                      )}
                    >
                      {isJau ? signedValStr : '-'}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-mono text-sm whitespace-nowrap',
                        isPed && valClass,
                      )}
                    >
                      {isPed ? signedValStr : '-'}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-mono text-sm whitespace-nowrap',
                        isLen && valClass,
                      )}
                    >
                      {isLen ? signedValStr : '-'}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-mono text-sm whitespace-nowrap',
                        isPro && valClass,
                      )}
                    >
                      {isPro ? signedValStr : '-'}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-mono font-medium whitespace-nowrap',
                        row.saldoFinanceiro >= 0 ? 'text-slate-800' : 'text-red-600',
                      )}
                    >
                      {formatCurrency(row.saldoFinanceiro)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                      {t.banco || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-800">{t.descricao}</div>
                      {t.observacoes && (
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1 print:line-clamp-none">
                          {t.observacoes}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Nenhum lançamento encontrado para os filtros selecionados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function DfcReport({ transactions }: { transactions: any[] }) {
  const getGroupTotal = (categories: string[], isExpense: boolean) => {
    return ['Jaú', 'Pederneiras', 'Lençóis Paulista']
      .map((unit) => {
        return transactions
          .filter((t) => {
            const u = t.unidade
            if (unit === 'Jaú') return u === 'Jau' || u === 'Jaú'
            if (unit === 'Lençóis Paulista') return u === 'L. Paulista' || u === 'Lençóis Paulista'
            return u === unit
          })
          .filter((t) => t.tipo === (isExpense ? 'despesa' : 'receita'))
          .filter((t) => categories.includes(t.categoria))
          .reduce((sum, t) => sum + Number(t.valor), 0)
      })
      .concat(
        transactions
          .filter((t) => t.tipo === (isExpense ? 'despesa' : 'receita'))
          .filter((t) => categories.includes(t.categoria))
          .reduce((sum, t) => sum + Number(t.valor), 0),
      )
  }

  const dfcStructure = [
    { title: '1. ATIVIDADES OPERACIONAIS', type: 'header' },
    {
      title: '1.1 Recebimentos de Vendas',
      isExpense: false,
      categories: [
        'Comissões Vendas',
        'Taxa Adm Locação',
        'Taxa Contrato Locação',
        'Taxa Comissão Seguros',
        'Aluguel',
      ],
    },
    {
      title: '1.2 Outras Receitas',
      isExpense: false,
      categories: RECEITAS.filter(
        (c) =>
          ![
            'Comissões Vendas',
            'Taxa Adm Locação',
            'Taxa Contrato Locação',
            'Taxa Comissão Seguros',
            'Aluguel',
          ].includes(c),
      ),
    },
    {
      title: '1.3 Custos Indiretos',
      isExpense: true,
      categories: [
        'Energia Prédio',
        'Água Prédio',
        'Estacionamento Empresa',
        'Aluguel Prédio',
        'Energia Imóveis',
        'Água Imóveis',
        'Condomínio',
      ],
    },
    {
      title: '1.4 Impostos',
      isExpense: true,
      categories: [
        'IRRF PJ',
        'ISSQN',
        'Simples Nacional',
        'Parcelamento Simples',
        'Simples Nacional Parcelado',
        'IR',
        'ITBI e Empreendimentos',
      ],
    },
    {
      title: '1.5 Pagamentos Trabalhistas',
      isExpense: true,
      categories: DESPESAS_FIXAS.filter((c) => c.startsWith('Folha')).concat([
        'Segurança do Trabalho',
        'FGTS e Rescisões',
        'Adiantamentos de Salário',
      ]),
    },
    {
      title: '1.5.1 Pró-labore (Silvio/Luciana)',
      isExpense: true,
      categories: ['Pró-labore'],
    },
    {
      title: '1.6 Despesas Vendas',
      isExpense: true,
      categories: [
        'Comissões Pagas Vendas',
        'Combustível Vendas',
        'Comissão Gerência',
        'Combustível Locação',
        'Combustível Pederneiras',
        'Combustível Lençóis',
        'Viagens e Estadias',
      ],
    },
    {
      title: '1.7 Marketing',
      isExpense: true,
      categories: ['Marketing Digital', 'Marketing Impresso'],
    },
    {
      title: '1.8 Administrativas',
      isExpense: true,
      categories: [
        'Sistemas e Software',
        'Internet',
        'Telefonia Fixa',
        'Telefonia Móvel',
        'Honorários Contábeis',
        'E-mail e Hospedagem',
      ],
    },
    {
      title: '1.9 Pagamentos Despesas Financeiras',
      isExpense: true,
      categories: [
        'Tarifas Bancárias',
        'Tarifa DOC/TED',
        'Multa e Juros Bancários',
        'Taxa Boleto',
        'Acordos e Parcelamentos',
      ],
    },
    {
      title: '1.10 Manutenções',
      isExpense: true,
      categories: ['Manutenção Equipamentos', 'Manutenção Sistemas', 'Manutenções Imóveis'],
    },
    {
      title: '1.11 Serviços Terceiros',
      isExpense: true,
      categories: ['Serviços Terceiros'],
    },
  ]

  let totalReceitas = 0
  let totalDespesas = 0

  const rows = dfcStructure.map((row) => {
    if (row.type === 'header') return row
    const vals = getGroupTotal(row.categories as string[], row.isExpense as boolean)
    if (!row.isExpense) totalReceitas += vals[3]
    else totalDespesas += vals[3]
    return { ...row, values: vals }
  })

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100 flex flex-row items-center gap-2">
        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
        <CardTitle className="text-lg text-slate-800">
          Demonstração dos Fluxos de Caixa (DFC)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-100">
              <TableRow>
                <TableHead className="w-[350px]">Descrição</TableHead>
                <TableHead className="text-right">Jaú</TableHead>
                <TableHead className="text-right">Pederneiras</TableHead>
                <TableHead className="text-right">L. Paulista</TableHead>
                <TableHead className="text-right font-bold bg-slate-200/50">Total R$</TableHead>
                <TableHead className="text-right">A.V.%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row: any, idx) => {
                if (row.type === 'header') {
                  return (
                    <TableRow key={idx} className="bg-slate-50 border-t-2 border-slate-200">
                      <TableCell colSpan={6} className="font-bold text-slate-700">
                        {row.title}
                      </TableCell>
                    </TableRow>
                  )
                }
                const isOp = !row.isExpense
                const totalVal = row.values[3]
                const av = totalReceitas > 0 ? (totalVal / totalReceitas) * 100 : 0

                return (
                  <TableRow key={idx} className="hover:bg-slate-50/50">
                    <TableCell className="pl-6 text-sm">{row.title}</TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency(row.values[0])}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency(row.values[1])}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency(row.values[2])}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-medium bg-slate-50/50',
                        isOp ? 'text-emerald-600' : 'text-red-600',
                      )}
                    >
                      {isOp ? '+' : '-'} {formatCurrency(totalVal)}
                    </TableCell>
                    <TableCell className="text-right text-xs text-slate-500 font-mono">
                      {av.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
            <TableFooter className="bg-slate-800 text-white">
              <TableRow className="hover:bg-slate-800">
                <TableCell className="font-bold text-base">Resultado Líquido</TableCell>
                <TableCell colSpan={3}></TableCell>
                <TableCell
                  className={cn(
                    'text-right font-bold text-lg',
                    totalReceitas - totalDespesas >= 0 ? 'text-emerald-400' : 'text-rose-400',
                  )}
                >
                  {formatCurrency(totalReceitas - totalDespesas)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
