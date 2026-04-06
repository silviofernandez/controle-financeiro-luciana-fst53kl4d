import { useState, useEffect, useMemo } from 'react'
import { format, parseISO, startOfDay, startOfMonth, endOfMonth, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DateRange } from 'react-day-picker'
import { Calendar as CalendarIcon, Download, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { DueDateAlerts } from '@/components/dashboard/DueDateAlerts'
import { IncomeExpenseChart } from '@/components/dashboard/IncomeExpenseChart'
import { CategoryDistribution } from '@/components/dashboard/CategoryDistribution'
import { BudgetMonitoring } from '@/components/dashboard/BudgetMonitoring'
import { LatestCheckpointIndicator } from '@/components/LatestCheckpointIndicator'

export default function Index() {
  const { toast } = useToast()
  const [apiTransactions, setApiTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

  useEffect(() => {
    const fetchLancamentos = async () => {
      setIsLoading(true)
      try {
        const data = await api.lancamentos.listar()
        setApiTransactions(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Failed to fetch API transactions', error)
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar dados',
          description: 'Não foi possível buscar as transações da API.',
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchLancamentos()
  }, [toast])

  const { periodTransactions, prevTransactions } = useMemo(() => {
    const valid = apiTransactions.filter((t: any) => !t.isCheckpoint)
    if (!dateRange?.from) return { periodTransactions: valid, prevTransactions: [] }

    const from = startOfDay(dateRange.from)
    const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(from)

    const diff = to.getTime() - from.getTime()
    const prevFrom = new Date(from.getTime() - diff - 24 * 60 * 60 * 1000)
    const prevTo = new Date(from.getTime() - 24 * 60 * 60 * 1000)

    const current = valid.filter((t: any) => {
      const dateStr = t.data_lancamento || t.data || t.date
      if (!dateStr) return false
      const d = parseISO(dateStr)
      return d >= from && d <= to
    })

    const prev = valid.filter((t: any) => {
      const dateStr = t.data_lancamento || t.data || t.date
      if (!dateStr) return false
      const d = parseISO(dateStr)
      return d >= prevFrom && d <= prevTo
    })

    return { periodTransactions: current, prevTransactions: prev }
  }, [apiTransactions, dateRange])

  const handleExportExcel = () => {
    const headers = [
      'Data',
      'Tipo',
      'Categoria',
      'Descrição',
      'Valor',
      'Unidade',
      'Banco',
      'Observações',
    ]
    const csvContent = periodTransactions.map((t: any) =>
      [
        t.data_lancamento ? format(parseISO(t.data_lancamento), 'dd/MM/yyyy') : '',
        t.tipo || '',
        t.categoria_id || t.categoria || '',
        t.descricao || '',
        t.valor || 0,
        t.unidade_id || t.unidade || '',
        t.banco || '',
        t.observacao || t.observacoes
          ? `"${(t.observacao || t.observacoes).replace(/"/g, '""')}"`
          : '',
      ].join(';'),
    )
    const csvStr = [headers.join(';'), ...csvContent].join('\n')
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio_${format(new Date(), 'yyyy-MM')}.csv`
    link.click()
    toast({
      title: 'Exportação Concluída',
      description: 'O arquivo CSV com observações foi baixado.',
    })
  }

  const handleExportPDF = () => {
    toast({
      title: 'Exportação PDF',
      description: 'Preparando documento com observações para impressão.',
    })
    setTimeout(() => window.print(), 500)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <LatestCheckpointIndicator />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Financeiro</h1>
          <p className="text-slate-500 mt-1">Visão geral e tendências financeiras.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[260px] justify-start text-left font-normal bg-white',
                  !dateRange && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`
                  ) : (
                    format(dateRange.from, 'dd/MM/yyyy')
                  )
                ) : (
                  <span>Selecione o período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" onClick={handleExportExcel} className="gap-2 bg-white">
            <Download className="h-4 w-4" /> Exportar
          </Button>
          <Button onClick={handleExportPDF} className="gap-2">
            <FileText className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <SummaryCards transactions={periodTransactions} isLoading={isLoading} />

      <div className="grid gap-6 md:grid-cols-3 items-stretch">
        <div className="md:col-span-2">
          <IncomeExpenseChart transactions={periodTransactions} dateRange={dateRange} />
        </div>
        <div className="md:col-span-1">
          <DueDateAlerts transactions={apiTransactions} />
        </div>
      </div>

      <BudgetMonitoring transactions={periodTransactions} />

      <CategoryDistribution transactions={periodTransactions} />
    </div>
  )
}
