import { useState } from 'react'
import { useTransactions } from '@/contexts/TransactionContext'
import { format, isThisWeek, isThisMonth, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { formatCurrency } from '@/lib/utils'

export function TransactionList() {
  const { transactions, deleteTransaction } = useTransactions()
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')

  const filteredTransactions = transactions
    .filter((t) => {
      const d = new Date(t.data)
      if (filter === 'today') return isToday(d)
      if (filter === 'week') return isThisWeek(d, { locale: ptBR })
      if (filter === 'month') return isThisMonth(d)
      return true
    })
    .slice(0, 15) // Limit to recent 15 for this view

  return (
    <Card className="shadow-md border-blue-100/50 flex-1 flex flex-col h-full">
      <CardHeader className="bg-gradient-to-r from-white to-blue-50/80 pb-4 rounded-t-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle className="text-lg">Últimos Lançamentos</CardTitle>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-md">
          {['all', 'today', 'week', 'month'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${filter === f ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {f === 'all' ? 'Todos' : f === 'today' ? 'Hoje' : f === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center flex-1">
            <div className="bg-blue-50/50 p-6 rounded-full mb-4">
              <img
                src="https://img.usecurling.com/i?q=empty%20box&shape=hand-drawn"
                alt="Vazio"
                className="w-16 h-16 opacity-40 grayscale"
              />
            </div>
            <p className="font-medium">Nenhum lançamento encontrado.</p>
            <p className="text-sm opacity-70 mt-1">Adicione novos itens no formulário.</p>
          </div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[90px]">Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="hidden md:table-cell">Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((t) => (
                  <TableRow key={t.id} className="group transition-colors hover:bg-blue-50/30">
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(t.data), 'dd/MM/yy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">{t.descricao}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="font-normal text-[10px] bg-slate-50/50">
                        {t.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium font-mono ${t.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {t.tipo === 'receita' ? '+' : '-'} {formatCurrency(t.valor)}
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
