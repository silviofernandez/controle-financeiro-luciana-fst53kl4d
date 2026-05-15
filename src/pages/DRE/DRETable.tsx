import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCur, formatPct, type DreData, type DreRow } from './dre-utils'
import { cn } from '@/lib/utils'

export function DRETable({ data }: { data: DreData }) {
  const renderRow = (row: DreRow, isExpense = false, isBold = false) => {
    const formatFn = (val: number) => (isExpense ? formatCur(-val) : formatCur(val))
    return (
      <TableRow
        key={row.label}
        className={cn('hover:bg-slate-50', isBold && 'font-bold bg-slate-100')}
      >
        <TableCell className="font-medium">{row.label}</TableCell>
        <TableCell className="text-right">{formatFn(row.jau)}</TableCell>
        <TableCell className="text-right">{formatFn(row.pederneiras)}</TableCell>
        <TableCell className="text-right">{formatFn(row.lencois)}</TableCell>
        <TableCell className="text-right">{formatFn(row.total)}</TableCell>
        <TableCell
          className={cn(
            'text-right font-medium',
            row.variance > 0
              ? isExpense
                ? 'text-red-600'
                : 'text-green-600'
              : row.variance < 0
                ? isExpense
                  ? 'text-green-600'
                  : 'text-red-600'
                : 'text-slate-500',
          )}
        >
          {row.variance > 0 ? '+' : ''}
          {row.variance.toFixed(1)}%
        </TableCell>
      </TableRow>
    )
  }

  const renderMargem = (row: DreRow) => (
    <TableRow className="font-bold bg-primary/10 text-primary">
      <TableCell>{row.label}</TableCell>
      <TableCell className="text-right">{row.jau.toFixed(1)}%</TableCell>
      <TableCell className="text-right">{row.pederneiras.toFixed(1)}%</TableCell>
      <TableCell className="text-right">{row.lencois.toFixed(1)}%</TableCell>
      <TableCell className="text-right">{row.total.toFixed(1)}%</TableCell>
      <TableCell
        className={cn(
          'text-right',
          row.variance > 0 ? 'text-green-600' : row.variance < 0 ? 'text-red-600' : '',
        )}
      >
        {row.variance > 0 ? '+' : ''}
        {row.variance.toFixed(1)} pp
      </TableCell>
    </TableRow>
  )

  return (
    <div className="rounded-md border bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-slate-800">
          <TableRow>
            <TableHead className="text-slate-100">Descrição</TableHead>
            <TableHead className="text-slate-100 text-right">Jaú</TableHead>
            <TableHead className="text-slate-100 text-right">Pederneiras</TableHead>
            <TableHead className="text-slate-100 text-right">Lençóis Paulista</TableHead>
            <TableHead className="text-slate-100 text-right font-bold">Total</TableHead>
            <TableHead className="text-slate-100 text-right">Comparativo (%)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="bg-slate-50 font-bold text-slate-700">
            <TableCell colSpan={6}>RECEITAS OPERACIONAIS</TableCell>
          </TableRow>
          {data.receitas.rows.map((r) => renderRow(r))}
          {renderRow(data.receitas.total, false, true)}

          <TableRow className="bg-slate-50 font-bold text-slate-700">
            <TableCell colSpan={6}>(-) DESPESAS FIXAS</TableCell>
          </TableRow>
          {data.fixas.rows.map((r) => renderRow(r, true))}
          {renderRow(data.fixas.total, true, true)}

          <TableRow className="bg-slate-50 font-bold text-slate-700">
            <TableCell colSpan={6}>(-) DESPESAS VARIÁVEIS</TableCell>
          </TableRow>
          {data.variaveis.rows.map((r) => renderRow(r, true))}
          {renderRow(data.variaveis.total, true, true)}

          <TableRow className="h-4" />
          {renderRow(data.resultado, false, true)}
          {renderMargem(data.margem)}
        </TableBody>
      </Table>
    </div>
  )
}
