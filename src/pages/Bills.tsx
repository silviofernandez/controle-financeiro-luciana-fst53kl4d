import { useState } from 'react'
import { useBills, computeBillStatus, getOverdueDays } from '@/hooks/use-bills'
import { BillsCards } from '@/components/bills/BillsCards'
import { BillsCalendar } from '@/components/bills/BillsCalendar'
import { BillsTable } from '@/components/bills/BillsTable'
import { BillFormDialog } from '@/components/bills/BillFormDialog'
import { BillPaymentDialog } from '@/components/bills/BillPaymentDialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, AlertTriangle, Plus } from 'lucide-react'
import { Bill } from '@/types/bills'
import { Loader2 } from 'lucide-react'

export default function Bills() {
  const { bills, isLoading, refresh } = useBills()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [paymentBill, setPaymentBill] = useState<Bill | null>(null)

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const hasVeryOverdue = bills.some((b) => getOverdueDays(b) > 5)
  const hasVencido = bills.some((b) => computeBillStatus(b) === 'Vencido')

  return (
    <div className="container mx-auto p-4 max-w-7xl animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas a Pagar/Receber</h1>
          <p className="text-muted-foreground">Gerencie seus compromissos e agenda financeira.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Conta
        </Button>
      </div>

      {hasVeryOverdue && (
        <div className="bg-red-100 border border-red-200 text-red-800 p-4 rounded-md font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Atenção: Há contas com mais de 5 dias de atraso!
        </div>
      )}
      {!hasVeryOverdue && hasVencido && (
        <div className="bg-yellow-100 border border-yellow-200 text-yellow-800 p-4 rounded-md font-medium flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Aviso: Você possui contas vencidas.
        </div>
      )}

      <BillsCards bills={bills} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <BillsCalendar bills={bills} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          {selectedDate && (
            <Button
              variant="ghost"
              className="w-full mt-2"
              onClick={() => setSelectedDate(undefined)}
            >
              Limpar Filtro de Data
            </Button>
          )}
        </div>
        <div className="lg:col-span-3">
          <BillsTable bills={bills} selectedDate={selectedDate} onPay={(b) => setPaymentBill(b)} />
        </div>
      </div>

      <BillFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} onSuccess={refresh} />

      <BillPaymentDialog
        bill={paymentBill}
        open={!!paymentBill}
        onOpenChange={(v) => !v && setPaymentBill(null)}
        onSuccess={refresh}
      />
    </div>
  )
}
