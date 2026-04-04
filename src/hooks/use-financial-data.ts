import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export interface Transaction {
  id: string
  amount: number
  date: string
  type: 'Receita' | 'Despesa Fixa' | 'Despesa Variável'
  category: string
  unit: string
  description: string
}

export function useFinancialData() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const data = await pb.collection('transactions').getFullList<Transaction>({
        sort: '-date',
      })
      setTransactions(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('transactions', () => {
    loadData()
  })

  return { transactions, loading }
}
