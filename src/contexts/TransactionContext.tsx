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
  updateTransaction: (
    id: string,
    t: Partial<Omit<Transaction, 'id' | 'created_at'>>,
  ) => Promise<void>
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
    card_id: record.card_id,
    created_at: record.created,
  }
}

const mapTransactionToRecord = (
  t: Partial<Omit<Transaction, 'id' | 'created_at'>>,
  userId: string,
) => {
  const rec: any = { user_id: userId }
  if (t.descricao !== undefined) rec.description = t.descricao
  if (t.valor !== undefined) rec.amount = t.valor
  if (t.data !== undefined) rec.date = new Date(t.data).toISOString()
  if (t.tipo !== undefined || t.classificacao !== undefined) {
    let pbType = 'Despesa Variável'
    if (t.tipo === 'receita') pbType = 'Receita'
    else if (t.classificacao === 'fixo') pbType = 'Despesa Fixa'
    rec.type = pbType
  }
  if (t.categoria !== undefined) rec.category = t.categoria || 'Outros'
  if (t.unidade !== undefined) {
    let pbUnit = t.unidade as string
    if (pbUnit === 'Jau') pbUnit = 'Jaú'
    if (pbUnit === 'L. Paulista') pbUnit = 'Lençóis Paulista'
    rec.unit = pbUnit
  }
  if (t.banco !== undefined) rec.bank = t.banco || 'Outros'
  if (t.observacoes !== undefined) rec.observations = t.observacoes || ''
  if (t.card_id !== undefined) rec.card_id = t.card_id || null

  return rec
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
      const rec = mapTransactionToRecord(t, user.id)
      if (!rec.type) rec.type = t.tipo === 'receita' ? 'Receita' : 'Despesa Variável'
      await pb.collection('transactions').create(rec)
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
        const rec = mapTransactionToRecord(t, user.id)
        if (!rec.type) rec.type = t.tipo === 'receita' ? 'Receita' : 'Despesa Variável'
        await pb.collection('transactions').create(rec)
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

  const updateTransaction = async (
    id: string,
    t: Partial<Omit<Transaction, 'id' | 'created_at'>>,
  ) => {
    if (!user) return
    setIsSyncing(true)
    try {
      const rec = mapTransactionToRecord(t, user.id)
      await pb.collection('transactions').update(id, rec)
      toast({ title: 'Atualizado', description: 'Lançamento salvo com sucesso.' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar.', variant: 'destructive' })
    } finally {
      setIsSyncing(false)
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
        updateTransaction,
        deleteTransaction,
        isSyncing,
        syncData,
      }}
    >
      {children}
    </TransactionContext.Provider>
  )
}
