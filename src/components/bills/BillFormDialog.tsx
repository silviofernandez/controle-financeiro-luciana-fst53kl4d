import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { Switch } from '@/components/ui/switch'
import { CATEGORIES, UNIDADES, BANCOS } from '@/types'
import { createBill } from '@/services/bills'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'

export function BillFormDialog({ open, onOpenChange, onSuccess }: any) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    vencimento: '',
    category: CATEGORIES[0],
    unidade: UNIDADES[0],
    banco: BANCOS[0],
    recorrente: false,
    recorrencia_dia: '1',
    recorrencia_meses: '0',
    observacoes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSubmitting(true)
    try {
      await createBill(
        {
          descricao: formData.descricao,
          valor: Number(formData.valor),
          vencimento: formData.vencimento,
          category: formData.category,
          unidade: formData.unidade,
          banco: formData.banco,
          recorrente: formData.recorrente,
          recorrencia_dia: Number(formData.recorrencia_dia),
          recorrencia_meses: Number(formData.recorrencia_meses),
          observacoes: formData.observacoes,
        },
        user.id,
      )
      toast({ title: 'Sucesso', description: 'Conta criada com sucesso.' })
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Conta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                required
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                required
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Vencimento</Label>
              <Input
                required
                type="date"
                value={formData.vencimento}
                onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
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
                value={formData.unidade}
                onValueChange={(v) => setFormData({ ...formData, unidade: v })}
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
              <Label>Banco Previsto</Label>
              <Select
                value={formData.banco}
                onValueChange={(v) => setFormData({ ...formData, banco: v })}
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

          <div className="flex items-center space-x-2 py-2">
            <Switch
              checked={formData.recorrente}
              onCheckedChange={(v) => setFormData({ ...formData, recorrente: v })}
            />
            <Label>Conta Recorrente</Label>
          </div>

          {formData.recorrente && (
            <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-md border">
              <div className="space-y-2">
                <Label>Dia do mês</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.recorrencia_dia}
                  onChange={(e) => setFormData({ ...formData, recorrencia_dia: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Repetir por X meses (0 = indf.)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.recorrencia_meses}
                  onChange={(e) => setFormData({ ...formData, recorrencia_meses: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              className="mr-2"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Salvar Conta
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
