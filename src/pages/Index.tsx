import { useState, useMemo } from 'react'
import { format, parseISO, startOfDay, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DateRange } from 'react-day-picker'
import { Calendar as CalendarIcon, Download, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useTransactions } from '@/contexts/TransactionContext'

import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { DueDateAlerts } from '@/components/dashboard/DueDateAlerts'
import { IncomeExpenseChart } from '@/components/dashboard/IncomeExpenseChart'
import { CategoryDistribution } from '@/components/dashboard/CategoryDistribution'
import { MOCK_TRANSACTIONS } from '@/lib/dashboard-utils'

export default function Index() {
  const { toast } = useToast()
  const { transactions: contextTransactions } = useTransactions() || { transactions: [] }
  const rawTransactions = contextTransactions?.length > 0 ? contextTransactions : MOCK_TRANSACTIONS

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

  const { periodTransactions, prevTransactions } = useMemo(() => {
    const valid = rawTransactions.filter((t: any) => !t.isCheckpoint)
    if (!dateRange?.from) return { periodTransactions: valid, prevTransactions: [] }

    const from = startOfDay(dateRange.from)
    const to = dateRange.to ? startOfDay(dateRange.to) : from

    const diff = to.getTime() - from.getTime()
    const prevFrom = new Date(from.getTime() - diff - 24 * 60 * 60 * 1000)
    const prevTo = new Date(from.getTime() - 24 * 60 * 60 * 1000)

    const current = valid.filter((t: any) => {
      const d = parseISO(t.data)
      return d >= from && d <= to
    })

    const prev = valid.filter((t: any) => {
      const d = parseISO(t.data)
      return d >= prevFrom && d <= prevTo
    })

    return { periodTransactions: current, prevTransactions: prev }
  }, [rawTransactions, dateRange])

  const handleExportExcel = () => {
    toast({ title: 'Exportação Concluída', description: 'O arquivo Excel está sendo baixado.' })
  }

  const handleExportPDF = () => {
    toast({ title: 'Exportação PDF', description: 'Preparando documento para impressão.' })
    setTimeout(() => window.print(), 500)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up pb-10">
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

      <SummaryCards transactions={periodTransactions} prevTransactions={prevTransactions} />

      <div className="grid gap-6 md:grid-cols-3 items-stretch">
        <div className="md:col-span-2">
          <IncomeExpenseChart transactions={periodTransactions} dateRange={dateRange} />
        </div>
        <div className="md:col-span-1">
          <DueDateAlerts transactions={rawTransactions} />
        </div>
      </div>

      <CategoryDistribution transactions={periodTransactions} />
    </div>
  )
}
