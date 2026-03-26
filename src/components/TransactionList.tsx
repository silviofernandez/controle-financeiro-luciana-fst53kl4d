import { useState } from 'react'
import { useTransactions } from '@/contexts/TransactionContext'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trash2, Search, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'
import { formatCurrency } from '@/lib/utils'
import { UNIDADES, BANCOS } from '@/types'

export function TransactionList() {
  const { transactions, deleteTransaction } = useTransactions()
  const [filterUnidade, setFilterUnidade] = useState<string>('all')
  const [filterBanco, setFilterBanco] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTransactions = transactions.filter(
    (t) =>
      (filterUnidade === 'all' || t.unidade === filterUnidade) &&
      (filterBanco === 'all' || t.banco === filterBanco) &&
      (!searchTerm ||
        (typeof t.descricao === 'string' &&
          t.descricao.toLowerCase().includes(searchTerm.toLowerCase()))),
  )

  const formatDateSafe = (dateString: string | undefined | null) => {
    try {
      if (!dateString || typeof dateString !== 'string') return '-'
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '-'
      return format(date, 'dd/MM/yy', { locale: ptBR })
    } catch {
      return '-'
    }
  }

  return (
    <Card className="shadow-md border-blue-100/50 flex-1 flex flex-col h-full overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-white to-blue-50/80 pb-4 rounded-t-lg flex flex-col gap-4 shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
          <CardTitle className="text-lg">Lançamentos Detalhados</CardTitle>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Select value={filterUnidade} onValueChange={setFilterUnidade}>
              <SelectTrigger className="w-[140px] h-8 bg-white text-xs">
                <SelectValue placeholder="Unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Unidades</SelectItem>
                {UNIDADES.filter((u) => u && typeof u === 'string' && u.trim() !== '').map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterBanco} onValueChange={setFilterBanco}>
              <SelectTrigger className="w-[140px] h-8 bg-white text-xs">
                <SelectValue placeholder="Banco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Bancos</SelectItem>
                {BANCOS.filter((b) => b && typeof b === 'string' && b.trim() !== '').map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Procurar despesas (ex: integrale)..."
            className="pl-9 pr-9 bg-white h-9 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center flex-1">
            <p className="font-medium">Nenhum lançamento encontrado com os filtros atuais.</p>
          </div>
        ) : (
          <div className="overflow-auto flex-1 h-full">
            <Table className="w-full relative">
              <TableHeader className="bg-slate-50/90 sticky top-0 z-10 shadow-sm backdrop-blur-sm">
                <TableRow>
                  <TableHead className="w-[80px] whitespace-nowrap">Data</TableHead>
                  <TableHead className="min-w-[180px]">Histórico</TableHead>
                  <TableHead className="hidden md:table-cell">Unidade</TableHead>
                  <TableHead className="hidden lg:table-cell">Status/Banco</TableHead>
                  <TableHead className="hidden md:table-cell text-center">Tipo</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Valor</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((t) => (
                  <TableRow
                    key={t.id}
                    className={`group transition-colors hover:bg-slate-50/50 ${
                      t.isCheckpoint
                        ? 'bg-emerald-50/40 border-l-4 border-l-emerald-500 hover:bg-emerald-50/60'
                        : ''
                    }`}
                  >
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateSafe(t.data)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-medium block ${t.isCheckpoint ? 'text-emerald-800 italic' : ''}`}
                      >
                        {typeof t.descricao === 'string' ? t.descricao : 'Sem descrição'}
                      </span>
                      <div className="flex md:hidden gap-1 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-white/50">
                          {t.unidade}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1.5 py-0 h-4 bg-slate-100"
                        >
                          {t.banco}
                        </Badge>
                        {t.tipo === 'despesa' && t.classificacao && (
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1.5 py-0 h-4 ${t.classificacao === 'fixo' ? 'text-indigo-600 border-indigo-200 bg-indigo-50/50' : 'text-amber-600 border-amber-200 bg-amber-50/50'}`}
                          >
                            {t.classificacao === 'fixo' ? 'Fixo' : 'Var'}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm">{t.unidade}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge
                        variant="secondary"
                        className="font-normal text-[10px] bg-slate-100/80 text-slate-600"
                      >
                        {t.banco}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-center">
                      {t.tipo === 'despesa' && t.classificacao && !t.isCheckpoint && (
                        <Badge
                          variant="outline"
                          className={`font-normal text-[10px] ${t.classificacao === 'fixo' ? 'text-indigo-600 border-indigo-200 bg-indigo-50/50' : 'text-amber-600 border-amber-200 bg-amber-50/50'}`}
                        >
                          {t.classificacao === 'fixo' ? 'Fixo' : 'Variável'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium font-mono whitespace-nowrap ${
                        t.isCheckpoint
                          ? 'text-emerald-700'
                          : t.tipo === 'receita'
                            ? 'text-green-600'
                            : 'text-red-600'
                      }`}
                    >
                      {t.isCheckpoint ? '' : t.tipo === 'receita' ? '+' : '-'}{' '}
                      {formatCurrency(Number(t.valor) || 0)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                        onClick={() => deleteTransaction(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
