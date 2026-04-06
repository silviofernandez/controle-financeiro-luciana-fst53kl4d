import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Transaction, CATEGORIES, UNIDADES, BANCOS } from '@/types'
import { useTransactions } from '@/contexts/TransactionContext'
import { toast } from '@/hooks/use-toast'
import { Button } from './ui/button'
import { Loader2 } from 'lucide-react'

interface Props {
  transaction: Transaction | null
  onClose: () => void
}

export function TransactionEditorSheet({ transaction, onClose }: Props) {
  const { updateTransaction } = useTransactions()
  const [formData, setFormData] = useState<Partial<any>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (transaction) {
      setFormData({
        descricao: transaction.descricao || '',
        valor: transaction.valor || 0,
        tipo: transaction.tipo || 'despesa_variavel',
        data: transaction.data?.split('T')[0] || transaction.data_lancamento?.split('T')[0] || '',
        competencia: transaction.competencia || '',
        unidade: transaction.unidade || transaction.unidade_nome || transaction.unidade_id || '',
        categoria:
          transaction.categoria || transaction.categoria_nome || transaction.categoria_id || '',
        banco: transaction.banco || '',
        observacoes: transaction.observacoes || transaction.observacao || '',
      })
    }
  }, [transaction])

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!transaction) return

    if (
      !formData.descricao ||
      !formData.valor ||
      !formData.data ||
      !formData.unidade ||
      !formData.categoria
    ) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const payload = {
        descricao: formData.descricao,
        valor: typeof formData.valor === 'string' ? parseFloat(formData.valor) : formData.valor,
        tipo: formData.tipo,
        data: formData.data,
        unidade: formData.unidade,
        categoria: formData.categoria,
        banco: formData.banco || undefined,
        competencia: formData.competencia || undefined,
        observacoes: formData.observacoes || undefined,
      }

      await updateTransaction(transaction.id, payload)
      onClose()
    } catch (error: any) {
      // The context already displays the error toast
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editar Lançamento</SheetTitle>
          <SheetDescription>Edite os detalhes do lançamento e clique em salvar.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              value={formData.descricao || ''}
              onChange={(e) => handleChange('descricao', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.valor || ''}
                onChange={(e) => handleChange('valor', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Lançamento</Label>
              <Input
                type="date"
                value={formData.data || ''}
                onChange={(e) => handleChange('data', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={formData.tipo || ''} onValueChange={(v) => handleChange('tipo', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa_fixa">Despesa Fixa</SelectItem>
                <SelectItem value="despesa_variavel">Despesa Variável</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.categoria || ''}
                onValueChange={(v) => handleChange('categoria', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select
                value={formData.unidade || ''}
                onValueChange={(v) => handleChange('unidade', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Banco</Label>
            <Select value={formData.banco || ''} onValueChange={(v) => handleChange('banco', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BANCOS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Competência (Opcional)</Label>
            <Input
              type="month"
              value={formData.competencia || ''}
              onChange={(e) => handleChange('competencia', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Observações (Opcional)</Label>
            <Textarea
              value={formData.observacoes || ''}
              onChange={(e) => handleChange('observacoes', e.target.value)}
            />
          </div>

          <Button onClick={handleSave} className="w-full mt-4" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
