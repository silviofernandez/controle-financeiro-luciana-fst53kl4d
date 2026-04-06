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
import { Transaction } from '@/types'
import { api } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { Button } from './ui/button'
import { Loader2 } from 'lucide-react'

interface Props {
  transaction: Transaction | null
  onClose: () => void
}

export function TransactionEditorSheet({ transaction, onClose }: Props) {
  const [formData, setFormData] = useState<Partial<any>>({})
  const [apiCategorias, setApiCategorias] = useState<any[]>([])
  const [apiUnidades, setApiUnidades] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.categorias.listarCategorias().then(setApiCategorias).catch(console.error)
    api.unidades.listarUnidades().then(setApiUnidades).catch(console.error)
  }, [])

  useEffect(() => {
    if (transaction) {
      setFormData({
        descricao: transaction.descricao || transaction.description || '',
        valor: transaction.valor || transaction.amount || 0,
        tipo: transaction.tipo || transaction.type || 'despesa_variavel',
        data_lancamento:
          transaction.data_lancamento ||
          transaction.data?.split('T')[0] ||
          transaction.date?.split('T')[0] ||
          '',
        competencia: transaction.competencia || '',
        unidade_id: transaction.unidade_id || '',
        categoria_id: transaction.categoria_id || '',
        observacao:
          transaction.observacao || transaction.observacoes || transaction.observations || '',
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
      !formData.data_lancamento ||
      !formData.unidade_id ||
      !formData.categoria_id
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
        data_lancamento: formData.data_lancamento,
        unidade_id: formData.unidade_id,
        categoria_id: formData.categoria_id,
        competencia: formData.competencia || undefined,
        observacao: formData.observacao || undefined,
      }

      await api.lancamentos.atualizar(transaction.id, payload)
      toast({ title: 'Sucesso', description: 'Lançamento atualizado com sucesso!' })

      // Dispatch custom event to notify lists to refresh
      window.dispatchEvent(new Event('transactions-updated'))

      onClose()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar',
        variant: 'destructive',
      })
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
                value={formData.data_lancamento || ''}
                onChange={(e) => handleChange('data_lancamento', e.target.value)}
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
                value={formData.categoria_id || ''}
                onValueChange={(v) => handleChange('categoria_id', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {apiCategorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome || c.name || c.descricao || c.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select
                value={formData.unidade_id || ''}
                onValueChange={(v) => handleChange('unidade_id', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {apiUnidades.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome || u.name || u.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              value={formData.observacao || ''}
              onChange={(e) => handleChange('observacao', e.target.value)}
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
