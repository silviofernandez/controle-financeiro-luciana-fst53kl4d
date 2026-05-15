import pb from '@/lib/pocketbase/client'
import { Bill } from '@/types/bills'
import { addMonths, format, parseISO } from 'date-fns'

export const createBill = async (data: Partial<Bill>, userId: string) => {
  const baseBill = {
    ...data,
    user_id: userId,
    status: 'Pendente',
    vencimento: data.vencimento ? format(parseISO(data.vencimento), 'yyyy-MM-dd 12:00:00') : '',
  }

  const created = await pb.collection('contas_pagar').create<Bill>(baseBill)

  if (data.recorrente) {
    const limit =
      !data.recorrencia_meses || data.recorrencia_meses === 0 ? 12 : data.recorrencia_meses
    const dt = parseISO(data.vencimento!)

    for (let i = 1; i <= limit; i++) {
      const nextDate = addMonths(dt, i)
      if (data.recorrencia_dia) {
        const lastDay = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()
        nextDate.setDate(Math.min(data.recorrencia_dia, lastDay))
      }
      await pb.collection('contas_pagar').create({
        ...baseBill,
        vencimento: format(nextDate, 'yyyy-MM-dd 12:00:00'),
      })
    }
  }
  return created
}

export const markBillAsPaid = async (id: string) => {
  return pb.collection('contas_pagar').update<Bill>(id, { status: 'Pago' })
}
