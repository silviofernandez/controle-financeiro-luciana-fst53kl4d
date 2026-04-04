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
import { Transaction, UNIDADES, BANCOS } from '@/types'
import { useTransactions } from '@/contexts/TransactionContext'
import { useCreditCards } from '@/contexts/CreditCardContext'
import { useSettings } from '@/contexts/SettingsContext'

interface Props {
  transaction: Transaction | null
  onClose: () => void
}

export function TransactionEditorSheet({ transaction, onClose }: Props) {
  const { updateTransaction } = useTransactions()
  const { cards } = useCreditCards()
  const { categories } = useSettings()

  const [formData, setFormData] = useState<Partial<Transaction>>({})

  useEffect(() => {
    if (transaction) {
      setFormData({
        descricao: transaction.descricao,
        valor: transaction.valor,
        data: transaction.data ? transaction.data.split('T')[0] : '',
        categoria: transaction.categoria,
        unidade: transaction.unidade,
        banco: transaction.banco,
        observacoes: transaction.observacoes || '',
        card_id: transaction.card_id || 'none',
      })
    }
  }, [transaction])

  const handleChange = (field: keyof Transaction, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!transaction) return
    const dataToSave = { ...formData }
    if (dataToSave.card_id === 'none') dataToSave.card_id = ''
    await updateTransaction(transaction.id, dataToSave)
    onClose()
  }

  return (
    <Sheet open={!!transaction} onOpenChange={(open) => !open && handleSave()}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editar Lançamento</SheetTitle>
          <SheetDescription>
            Edite os detalhes do lançamento. As alterações são salvas automaticamente ao fechar.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              value={formData.descricao || ''}
              onChange={(e) => handleChange('descricao', e.target.value)}
              onBlur={handleSave}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="number"
                value={formData.valor || ''}
                onChange={(e) => handleChange('valor', parseFloat(e.target.value))}
                onBlur={handleSave}
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={formData.data || ''}
                onChange={(e) => handleChange('data', e.target.value)}
                onBlur={handleSave}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={formData.categoria}
              onValueChange={(v) => {
                handleChange('categoria', v)
                handleSave()
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select
                value={formData.unidade}
                onValueChange={(v) => {
                  handleChange('unidade', v)
                  handleSave()
                }}
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
            <div className="space-y-2">
              <Label>Banco</Label>
              <Select
                value={formData.banco}
                onValueChange={(v) => {
                  handleChange('banco', v)
                  handleSave()
                }}
              >
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
          </div>
          <div className="space-y-2">
            <Label>Cartão de Crédito</Label>
            <Select
              value={formData.card_id || 'none'}
              onValueChange={(v) => {
                handleChange('card_id', v)
                handleSave()
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {cards.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.observacoes || ''}
              onChange={(e) => handleChange('observacoes', e.target.value)}
              onBlur={handleSave}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
