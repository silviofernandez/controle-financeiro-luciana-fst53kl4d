import { useState, useMemo } from 'react'
import { useTransactions } from '@/contexts/TransactionContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowDownUp,
  TrendingUp,
  TrendingDown,
  Activity,
  Wallet,
  MessageSquareText,
} from 'lucide-react'
import { ReconciliationAlert } from '@/components/ReconciliationAlert'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export default function Reports() {
  const { transactions } = useTransactions()
  const [unit, setUnit] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [highlightDate, setHighlightDate] = useState<string | null>(null)

  const handleAdjustDivergence = (date: string) => {
    setHighlightDate(date)
    setSortOrder('desc')
    setUnit('all')

    setTimeout(() => {
      const tableEl = document.getElementById('transactions-table')
      if (tableEl) {
        tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }

      setTimeout(() => {
        const firstHighlighted = document.querySelector('.highlighted-row')
        if (firstHighlighted) {
          firstHighlighted.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 300)
    }, 100)
  }

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter((t) => !t.isCheckpoint)

    if (unit !== 'all') {
      // Lençóis is mapped to 'L. Paulista' in the system
      const unitToMatch = unit === 'Lençóis' ? 'L. Paulista' : unit
      filtered = filtered.filter((t) => t.unidade === unitToMatch)
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.data).getTime()
      const dateB = new Date(b.data).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })
  }, [transactions, unit, sortOrder])

  const summary = useMemo(() => {
    const faturamento = filteredTransactions
      .filter((t) => t.tipo === 'receita')
      .reduce((acc, t) => acc + t.valor, 0)

    const despesasGerais = filteredTransactions
      .filter((t) => t.tipo === 'despesa')
      .reduce((acc, t) => acc + t.valor, 0)

    const custosOperacionais = filteredTransactions
      .filter(
        (t) =>
          t.tipo === 'despesa' &&
          (t.classificacao === 'fixo' ||
            t.classificacao === 'variavel' ||
            t.categoria === 'Fornecedores' ||
            t.categoria === 'Folha de Pagamento' ||
            t.categoria === 'Outros'),
      )
      .reduce((acc, t) => acc + t.valor, 0)

    const saldoLiquido = faturamento - despesasGerais

    return { faturamento, despesasGerais, custosOperacionais, saldoLiquido }
  }, [filteredTransactions])

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <ReconciliationAlert onAdjust={handleAdjustDivergence} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Relatórios e Histórico</h2>
          <p className="text-muted-foreground mt-1">
            Acompanhe o histórico de transações e a performance financeira.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className="w-full sm:w-[200px] bg-white shadow-sm">
              <SelectValue placeholder="Selecione a Unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cia (Visão Geral)</SelectItem>
              <SelectItem value="Jau">Jaú</SelectItem>
              <SelectItem value="Pederneiras">Pederneiras</SelectItem>
              <SelectItem value="Lençóis">Lençóis</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="bg-white whitespace-nowrap shadow-sm"
          >
            <ArrowDownUp className="w-4 h-4 mr-2" />
            Inverter Ordem
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-600">Faturamento Geral</CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(summary.faturamento)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-600">
              Custos Operacionais
            </CardTitle>
            <Activity className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(summary.custosOperacionais)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-600">Despesas Gerais</CardTitle>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.despesasGerais)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-slate-50/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-800">Saldo Líquido</CardTitle>
            <Wallet className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                summary.saldoLiquido >= 0 ? 'text-blue-700' : 'text-red-700'
              }`}
            >
              {formatCurrency(summary.saldoLiquido)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card id="transactions-table" className="shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
          <CardTitle className="text-lg text-slate-800">Lista Detalhada de Transações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative scroll-smooth">
            <Table>
              <TableHeader className="bg-white">
                <TableRow>
                  <TableHead className="w-[120px]">Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[150px]">Categoria</TableHead>
                  <TableHead className="w-[150px]">Observações</TableHead>
                  <TableHead className="w-[120px]">Tipo</TableHead>
                  <TableHead className="text-right w-[150px]">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((t) => {
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

                  return (
                    <TableRow
                      key={t.id}
                      className={cn(
                        'transition-all duration-500',
                        isHighlighted
                          ? 'bg-red-50/80 hover:bg-red-100/90 border-l-4 border-l-red-500 highlighted-row'
                          : 'hover:bg-slate-50/50 border-l-4 border-l-transparent',
                      )}
                    >
                      <TableCell className="text-sm text-slate-600">
                        {format(new Date(t.data), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">{t.descricao}</TableCell>
                      <TableCell className="text-slate-600">{t.categoria || '-'}</TableCell>
                      <TableCell className="max-w-[150px]">
                        {t.observacoes ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help group">
                                <MessageSquareText className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0" />
                                <span className="truncate text-xs text-slate-500 group-hover:text-blue-600">
                                  {t.observacoes}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[300px] text-xs z-50">
                              <p>{t.observacoes}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={t.tipo === 'receita' ? 'default' : 'destructive'}
                          className={
                            t.tipo === 'receita'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none'
                              : 'bg-red-100 text-red-800 hover:bg-red-200 border-none'
                          }
                        >
                          {t.tipo === 'receita' ? 'Receita' : 'Despesa'}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-mono font-medium',
                          t.tipo === 'receita' ? 'text-emerald-600' : 'text-red-600',
                        )}
                      >
                        {formatCurrency(t.valor)}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Nenhum lançamento encontrado para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
