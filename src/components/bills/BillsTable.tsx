import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Bill } from '@/types/bills'
import { computeBillStatus } from '@/hooks/use-bills'
import { parseISO, format, isSameDay } from 'date-fns'
import { useState, useMemo } from 'react'
import { UNIDADES, CATEGORIES } from '@/types'
import { Input } from '@/components/ui/input'

interface Props {
  bills: Bill[]
  selectedDate: Date | undefined
  onPay: (bill: Bill) => void
}

export function BillsTable({ bills, selectedDate, onPay }: Props) {
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [filterUnidade, setFilterUnidade] = useState('Todas')
  const [filterCat, setFilterCat] = useState('Todas')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      if (selectedDate && !isSameDay(parseISO(b.vencimento), selectedDate)) return false
      if (filterStatus !== 'Todos' && computeBillStatus(b) !== filterStatus) return false
      if (filterUnidade !== 'Todas' && b.unidade !== filterUnidade) return false
      if (filterCat !== 'Todas' && b.category !== filterCat) return false
      if (searchTerm && !b.descricao.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
  }, [bills, selectedDate, filterStatus, filterUnidade, filterCat, searchTerm])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Vencido':
        return <Badge variant="destructive">Vencido</Badge>
      case 'Vence Hoje':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Vence Hoje</Badge>
      case 'A Vencer':
        return <Badge className="bg-blue-500 hover:bg-blue-600">A Vencer</Badge>
      case 'Pago':
        return <Badge className="bg-green-500 hover:bg-green-600">Pago</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-48"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos Status</SelectItem>
            <SelectItem value="A Vencer">A Vencer</SelectItem>
            <SelectItem value="Vence Hoje">Vence Hoje</SelectItem>
            <SelectItem value="Vencido">Vencido</SelectItem>
            <SelectItem value="Pago">Pago</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterUnidade} onValueChange={setFilterUnidade}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Unidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas Unidades</SelectItem>
            {UNIDADES.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas Categorias</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Categoria / Unidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhuma conta encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredBills.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.descricao}</TableCell>
                  <TableCell>{format(parseISO(b.vencimento), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>R$ {b.valor.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span>{b.category}</span>
                      <span className="text-muted-foreground">{b.unidade}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(computeBillStatus(b))}</TableCell>
                  <TableCell className="text-right">
                    {b.status !== 'Pago' && (
                      <Button size="sm" variant="outline" onClick={() => onPay(b)}>
                        Marcar Pago
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
