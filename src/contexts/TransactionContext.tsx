import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Transaction } from '@/types'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from './AuthContext'

interface TransactionContextData {
  transactions: Transaction[]
  addTransaction: (t: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>
  addTransactions: (ts: Omit<Transaction, 'id' | 'created_at'>[]) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  isSyncing: boolean
  syncData: () => Promise<void>
}

const TransactionContext = createContext<TransactionContextData>({} as TransactionContextData)

export const useTransactions = () => useContext(TransactionContext)

const mapRecordToTransaction = (record: any): Transaction => {
  let tipo: 'receita' | 'despesa' = 'despesa'
  let classificacao: 'fixo' | 'variavel' | null = null

  if (record.type === 'Receita') {
    tipo = 'receita'
  } else if (record.type === 'Despesa Fixa') {
    tipo = 'despesa'
    classificacao = 'fixo'
  } else if (record.type === 'Despesa Variável') {
    tipo = 'despesa'
    classificacao = 'variavel'
  }

  let unidade = record.unit
  if (unidade === 'Jaú') unidade = 'Jau'
  if (unidade === 'Lençóis Paulista') unidade = 'L. Paulista'

  return {
    id: record.id,
    tipo,
    descricao: record.description,
    valor: record.amount,
    data: record.date,
    categoria: record.category,
    unidade: unidade,
    banco: record.bank,
    classificacao,
    observacoes: record.observations,
    created_at: record.created,
  }
}

const mapTransactionToRecord = (t: Omit<Transaction, 'id' | 'created_at'>, userId: string) => {
  let pbType = 'Despesa Variável'
  if (t.tipo === 'receita') {
    pbType = 'Receita'
  } else if (t.classificacao === 'fixo') {
    pbType = 'Despesa Fixa'
  }

  let pbUnit = t.unidade as string
  if (pbUnit === 'Jau') pbUnit = 'Jaú'
  if (pbUnit === 'L. Paulista') pbUnit = 'Lençóis Paulista'

  return {
    user_id: userId,
    description: t.descricao,
    amount: t.valor,
    date: new Date(t.data).toISOString(),
    type: pbType,
    category: t.categoria || 'Outros',
    unit: pbUnit,
    bank: t.banco || 'Outros',
    observations: t.observacoes || '',
  }
}

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return
    try {
      const records = await pb.collection('transactions').getFullList({
        sort: '-date',
      })
      setTransactions(records.map(mapRecordToTransaction))
    } catch (e) {
      console.error('Error loading transactions', e)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime(
    'transactions',
    () => {
      loadData()
    },
    !!user,
  )

  const addTransaction = async (t: Omit<Transaction, 'id' | 'created_at'>) => {
    if (!user) return
    setIsSyncing(true)
    try {
      await pb.collection('transactions').create(mapTransactionToRecord(t, user.id))
      toast({ title: 'Sucesso!', description: 'Lançamento adicionado com sucesso.' })
    } catch (error: any) {
      toast({ title: 'Erro', description: 'Falha ao adicionar.', variant: 'destructive' })
    } finally {
      setIsSyncing(false)
    }
  }

  const addTransactions = async (ts: Omit<Transaction, 'id' | 'created_at'>[]) => {
    if (!user) return
    setIsSyncing(true)
    try {
      for (const t of ts) {
        await pb.collection('transactions').create(mapTransactionToRecord(t, user.id))
      }
      toast({ title: 'Sucesso!', description: `${ts.length} lançamentos adicionados com sucesso.` })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Falha ao importar alguns lançamentos.',
        variant: 'destructive',
      })
    } finally {
      setIsSyncing(false)
      loadData()
    }
  }

  const deleteTransaction = async (id: string) => {
    setIsSyncing(true)
    try {
      await pb.collection('transactions').delete(id)
      toast({ title: 'Excluído', description: 'Item excluído com sucesso.' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' })
    } finally {
      setIsSyncing(false)
    }
  }

  const syncData = async () => {
    await loadData()
    toast({ title: 'Sincronizado', description: 'Dados atualizados com a nuvem!' })
  }

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransaction,
        addTransactions,
        deleteTransaction,
        isSyncing,
        syncData,
      }}
    >
      {children}
    </TransactionContext.Provider>
  )
}
