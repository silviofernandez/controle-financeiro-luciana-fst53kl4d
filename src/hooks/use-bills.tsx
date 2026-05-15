import { useState, useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Bill, ComputedBillStatus } from '@/types/bills'
import { isBefore, isToday, startOfDay, differenceInDays, parseISO } from 'date-fns'
import { useRealtime } from './use-realtime'

export const computeBillStatus = (bill: Bill): ComputedBillStatus => {
  if (bill.status === 'Pago') return 'Pago'
  const vDate = startOfDay(parseISO(bill.vencimento))
  const today = startOfDay(new Date())
  if (isBefore(vDate, today)) return 'Vencido'
  if (isToday(vDate)) return 'Vence Hoje'
  return 'A Vencer'
}

export const getOverdueDays = (bill: Bill): number => {
  if (bill.status === 'Pago') return 0
  const vDate = startOfDay(parseISO(bill.vencimento))
  const today = startOfDay(new Date())
  return isBefore(vDate, today) ? differenceInDays(today, vDate) : 0
}

export function useBills() {
  const { user } = useAuth()
  const [bills, setBills] = useState<Bill[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchBills = useCallback(async () => {
    if (!user) return
    try {
      const records = await pb.collection('contas_pagar').getFullList<Bill>({
        sort: 'vencimento',
      })
      setBills(records)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchBills()
  }, [fetchBills])

  useRealtime('contas_pagar', fetchBills)

  return { bills, isLoading, refresh: fetchBills }
}
