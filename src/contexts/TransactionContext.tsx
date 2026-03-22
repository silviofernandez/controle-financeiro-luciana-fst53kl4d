import React, { createContext, useContext, useState, useEffect } from 'react'
import { Transaction } from '@/types'
import { toast } from '@/hooks/use-toast'

interface TransactionContextData {
  transactions: Transaction[]
  addTransaction: (t: Omit<Transaction, 'id' | 'created_at'>) => void
  deleteTransaction: (id: string) => void
  isSyncing: boolean
  syncData: () => Promise<void>
}

const TransactionContext = createContext<TransactionContextData>({} as TransactionContextData)

export const useTransactions = () => useContext(TransactionContext)

const MOCK_DATA: Transaction[] = [
  {
    id: '1',
    tipo: 'receita',
    descricao: 'Salário',
    valor: 8500,
    data: new Date().toISOString(),
    categoria: 'Trabalho',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    tipo: 'despesa',
    descricao: 'Aluguel',
    valor: 2500,
    data: new Date().toISOString(),
    categoria: 'Casa',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    tipo: 'despesa',
    descricao: 'Supermercado',
    valor: 850,
    data: new Date(Date.now() - 86400000).toISOString(),
    categoria: 'Alimentação',
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    tipo: 'despesa',
    descricao: 'Uber',
    valor: 45.5,
    data: new Date(Date.now() - 86400000 * 2).toISOString(),
    categoria: 'Transporte',
    created_at: new Date().toISOString(),
  },
]

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('@financeiro:transactions')
    if (saved) return JSON.parse(saved)
    return MOCK_DATA
  })

  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    localStorage.setItem('@financeiro:transactions', JSON.stringify(transactions))
  }, [transactions])

  const addTransaction = (t: Omit<Transaction, 'id' | 'created_at'>) => {
    const newTx: Transaction = {
      ...t,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }
    setTransactions((prev) =>
      [newTx, ...prev].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    )
    toast({ title: 'Sucesso!', description: 'Lançamento adicionado com sucesso.' })
  }

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
    toast({ title: 'Excluído', description: 'Item excluído com sucesso.' })
  }

  const syncData = async () => {
    setIsSyncing(true)
    try {
      // Mock API call to Google Sheets
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast({ title: 'Sincronizado', description: 'Dados enviados para a planilha!' })
    } catch (e) {
      toast({ title: 'Erro', description: 'Erro ao sincronizar.', variant: 'destructive' })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <TransactionContext.Provider
      value={{ transactions, addTransaction, deleteTransaction, isSyncing, syncData }}
    >
      {children}
    </TransactionContext.Provider>
  )
}
