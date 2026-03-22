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
    tipo: 'despesa',
    descricao: 'Custos Operacionais Jau',
    valor: 184000,
    data: '2026-01-15T10:00:00.000Z',
    categoria: 'Outros',
    unidade: 'Jau',
    banco: 'Santander',
    created_at: '2026-01-15T10:00:00.000Z',
  },
  {
    id: '2',
    tipo: 'despesa',
    descricao: 'Folha e Fornecedores Pederneiras',
    valor: 10500,
    data: '2026-01-16T10:00:00.000Z',
    categoria: 'Folha de Pagamento',
    unidade: 'Pederneiras',
    banco: 'Inter',
    created_at: '2026-01-16T10:00:00.000Z',
  },
  {
    id: '3',
    tipo: 'despesa',
    descricao: 'Manutenção L. Paulista',
    valor: 16700,
    data: '2026-01-17T10:00:00.000Z',
    categoria: 'Fornecedores',
    unidade: 'L. Paulista',
    banco: 'BTG',
    created_at: '2026-01-17T10:00:00.000Z',
  },
  {
    id: '4',
    tipo: 'despesa',
    descricao: 'Despesas Silvio',
    valor: 39600,
    data: '2026-01-18T10:00:00.000Z',
    categoria: 'Outros',
    unidade: 'Silvio',
    banco: 'Nubank',
    created_at: '2026-01-18T10:00:00.000Z',
  },
  {
    id: '5',
    tipo: 'receita',
    descricao: 'Faturamento Geral Jan',
    valor: 300000,
    data: '2026-01-20T10:00:00.000Z',
    categoria: 'Trabalho',
    unidade: 'Geral',
    banco: 'Santander',
    created_at: '2026-01-20T10:00:00.000Z',
  },
  {
    id: '6',
    tipo: 'receita',
    descricao: 'Saldo Financeiro Fechamento',
    valor: 49200,
    data: '2026-01-31T23:59:59.000Z',
    categoria: 'Outros',
    unidade: 'Geral',
    banco: 'Outros',
    isCheckpoint: true,
    created_at: '2026-01-31T23:59:59.000Z',
  },
]

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('@financeiro:transactions:v2')
    if (saved) return JSON.parse(saved)
    return MOCK_DATA
  })

  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    localStorage.setItem('@financeiro:transactions:v2', JSON.stringify(transactions))
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
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast({ title: 'Sincronizado', description: 'Dados enviados para a nuvem!' })
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
