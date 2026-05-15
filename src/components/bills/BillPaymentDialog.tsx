import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { BANCOS, RECEITAS } from '@/types'
import { markBillAsPaid } from '@/services/bills'
import { useTransactions } from '@/contexts/TransactionContext'
import { Bill } from '@/types/bills'
import { toast } from '@/hooks/use-toast'

interface Props {
  bill: Bill | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function BillPaymentDialog({ bill, open, onOpenChange, onSuccess }: Props) {
  const [banco, setBanco] = useState(bill?.banco || BANCOS[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addTransaction } = useTransactions()

  const handleConfirm = async () => {
    if (!bill) return
    setIsSubmitting(true)
    try {
      await markBillAsPaid(bill.id)

      const isIncome = bill.category && RECEITAS.includes(bill.category)
      const tipo = isIncome ? 'receita' : 'despesa_variavel'

      await addTransaction({
        descricao: bill.descricao,
        valor: bill.valor,
        data: new Date().toISOString(),
        categoria: bill.category || 'Outros',
        unidade: (bill.unidade as any) || 'Geral',
        banco: (banco as any) || 'Outros',
        tipo: tipo,
        observacoes: 'Gerado automaticamente via Contas',
      })

      toast({ title: 'Sucesso', description: 'Conta marcada como paga e transação gerada.' })
      onSuccess()
      onOpenChange(false)
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e.message || 'Falha ao processar.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!bill) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Pagamento</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Confirma o pagamento de <strong>R$ {bill.valor.toFixed(2)}</strong> referente a{' '}
            <strong>{bill.descricao}</strong>?
          </p>
          <div className="space-y-2">
            <Label>Qual banco foi utilizado?</Label>
            <Select value={banco} onValueChange={setBanco}>
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
