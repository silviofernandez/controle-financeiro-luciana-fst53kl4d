import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTransactions } from '@/contexts/TransactionContext'
import { toast } from '@/hooks/use-toast'
import { ArrowLeft, CheckCircle2, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { CATEGORIES, UNIDADES, Transaction, Unidade } from '@/types'
import { PreviewItem } from './types'

interface ImportPreviewProps {
  items: PreviewItem[]
  onBack: () => void
  onComplete: () => void
}

export function ImportPreview({ items, onBack, onComplete }: ImportPreviewProps) {
  const { transactions, addTransactions } = useTransactions()
  const [localItems, setLocalItems] = useState<PreviewItem[]>(items)

  const handleUpdate = (id: string, field: keyof PreviewItem, value: any) => {
    setLocalItems((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const handleDelete = (id: string) => {
    setLocalItems((prev) => prev.filter((p) => p.id !== id))
  }

  const handleConfirm = () => {
    if (localItems.some((p) => !p.category)) {
      toast({
        title: 'Atenção',
        description: 'Alguns itens estão sem categoria definida.',
        variant: 'destructive',
      })
      return
    }

    const toAdd: Omit<Transaction, 'id' | 'created_at'>[] = localItems.map((p) => {
      let tipo: 'receita' | 'despesa' = 'despesa'
      let classificacao: 'fixo' | 'variavel' | null = null

      if (p.pbType === 'Receita') {
        tipo = 'receita'
      } else if (p.pbType === 'Despesa Fixa') {
        tipo = 'despesa'
        classificacao = 'fixo'
      } else if (p.pbType === 'Despesa Variável') {
        tipo = 'despesa'
        classificacao = 'variavel'
      }

      return {
        descricao: p.description,
        valor: p.value,
        data: p.date,
        unidade: p.unit,
        banco: p.bank,
        tipo,
        classificacao,
        categoria: p.category,
        isCheckpoint: p.isCheckpoint,
      }
    })

    const finalItems = toAdd.filter(
      (p) =>
        !transactions.some(
          (t) =>
            t.data.substring(0, 10) === p.data.substring(0, 10) &&
            t.valor === p.valor &&
            t.descricao.toLowerCase() === p.descricao.toLowerCase(),
        ),
    )

    if (finalItems.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Lançamentos extraídos já existem. Duplicatas ignoradas.',
      })
      onComplete()
      return
    }

    addTransactions(finalItems)
    toast({ title: 'Concluído', description: `${finalItems.length} lançamentos importados.` })
    onComplete()
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Revisão de Importação</h3>
        <p className="text-xs text-muted-foreground">{localItems.length} itens encontrados</p>
      </div>
      <div className="border rounded-md overflow-x-auto bg-white">
        <div className="min-w-[800px] max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(item.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs" title={item.description}>
                    {item.description}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium text-xs">
                    {formatCurrency(item.value)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.category}
                      onValueChange={(v) => handleUpdate(item.id, 'category', v)}
                    >
                      <SelectTrigger
                        className={`w-[160px] h-8 text-xs ${!item.category ? 'border-red-400' : ''}`}
                      >
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.pbType}
                      onValueChange={(v) => handleUpdate(item.id, 'pbType', v)}
                    >
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Receita">Receita</SelectItem>
                        <SelectItem value="Despesa Fixa">Despesa Fixa</SelectItem>
                        <SelectItem value="Despesa Variável">Despesa Variável</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.unit}
                      onValueChange={(v: Unidade) => handleUpdate(item.id, 'unit', v)}
                    >
                      <SelectTrigger className="w-[110px] h-8 text-xs">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIDADES.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex justify-between pt-4 border-t border-border/50">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <Button onClick={handleConfirm} className="gap-2">
          <CheckCircle2 className="w-4 h-4" /> Confirmar e Salvar
        </Button>
      </div>
    </div>
  )
}
