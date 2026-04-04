import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Plus } from 'lucide-react'
import { useCreditCards } from '@/contexts/CreditCardContext'
import { formatCurrency } from '@/lib/utils'

export function CreditCardSettings() {
  const { cards, addCard, deleteCard } = useCreditCards()
  const [name, setName] = useState('')
  const [type, setType] = useState<'Pessoal' | 'Empresarial'>('Pessoal')
  const [holder, setHolder] = useState('')
  const [limit, setLimit] = useState('')

  const handleAdd = () => {
    if (!name || !holder || !limit) return
    addCard({ name, type, holder, limit: Number(limit) })
    setName('')
    setHolder('')
    setLimit('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão de Cartões de Crédito</CardTitle>
        <CardDescription>
          Cadastre seus cartões para realizar a importação de faturas e conciliação.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="space-y-1">
            <Label>Nome do Cartão</Label>
            <Input
              placeholder="ex: Nubank PJ"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pessoal">Pessoal</SelectItem>
                <SelectItem value="Empresarial">Empresarial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Titular</Label>
            <Input
              placeholder="Nome impresso"
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Limite (R$)</Label>
            <Input
              type="number"
              placeholder="5000"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </div>
          <Button onClick={handleAdd} className="w-full gap-2">
            <Plus className="w-4 h-4" /> Adicionar
          </Button>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cartão</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Titular</TableHead>
                <TableHead>Limite</TableHead>
                <TableHead className="w-[80px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.type}</TableCell>
                  <TableCell>{c.holder}</TableCell>
                  <TableCell>{formatCurrency(c.limit)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => deleteCard(c.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {cards.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    Nenhum cartão cadastrado.
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
