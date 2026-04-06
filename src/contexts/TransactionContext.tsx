import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Transaction } from '@/types'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from './AuthContext'
import { ToastAction } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

interface TransactionContextData {
  transactions: Transaction[]
  addTransaction: (t: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>
  addTransactions: (
    ts: Omit<Transaction, 'id' | 'created_at'>[],
  ) => Promise<{ successes: number; failures: any[] }>
  updateTransaction: (
    id: string,
    t: Partial<Omit<Transaction, 'id' | 'created_at'>>,
  ) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  isSyncing: boolean
  syncProgress: { current: number; total: number } | null
  syncData: () => Promise<void>
}

const TransactionContext = createContext<TransactionContextData>({} as TransactionContextData)

export const useTransactions = () => useContext(TransactionContext)

const mapRecordToTransaction = (record: any): Transaction => {
  let tipo: 'receita' | 'despesa' | 'despesa_fixa' | 'despesa_variavel' = 'despesa_variavel'
  let classificacao: 'fixo' | 'variavel' | null = null

  if (record.type === 'Receita') {
    tipo = 'receita'
  } else if (record.type === 'Despesa Fixa') {
    tipo = 'despesa_fixa'
    classificacao = 'fixo'
  } else if (record.type === 'Despesa Variável') {
    tipo = 'despesa_variavel'
    classificacao = 'variavel'
  }

  return {
    id: record.id,
    tipo,
    descricao: record.description,
    valor: record.amount,
    data: record.date,
    categoria: record.category,
    unidade: record.unit,
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
    else if (t.tipo === 'despesa_fixa' || t.classificacao === 'fixo') pbType = 'Despesa Fixa'
    else if (t.tipo === 'despesa_variavel' || t.classificacao === 'variavel')
      pbType = 'Despesa Variável'
    rec.type = pbType
  }
  if (t.categoria !== undefined) rec.category = t.categoria || 'Outros'
  if (t.unidade !== undefined) rec.unit = t.unidade
  if (t.banco !== undefined) rec.bank = t.banco || 'Outros'
  if (t.observacoes !== undefined) rec.observations = t.observacoes || ''
  if (t.card_id !== undefined) rec.card_id = t.card_id || null

  return rec
}

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null)

  const loadData = useCallback(async () => {
    if (!user) return
    try {
      const records = await pb.collection('transactions').getFullList({
        sort: '-date',
      })
      setTransactions(records.map(mapRecordToTransaction))
    } catch (e) {
      // Ignore abort errors from auto-cancellation if any
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
      toast({
        title: 'Erro',
        description: getErrorMessage(error) || 'Falha ao adicionar.',
        variant: 'destructive',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const addTransactions = async (ts: Omit<Transaction, 'id' | 'created_at'>[]) => {
    if (!user) return { successes: 0, failures: [] }
    setIsSyncing(true)
    setSyncProgress({ current: 0, total: ts.length })

    let successes = 0
    const failures: Omit<Transaction, 'id' | 'created_at'>[] = []
    let currentProcessed = 0

    try {
      const BATCH_SIZE = 20
      for (let i = 0; i < ts.length; i += BATCH_SIZE) {
        const batch = ts.slice(i, i + BATCH_SIZE)

        const promises = batch.map(async (t) => {
          const rec = mapTransactionToRecord(t, user.id)
          if (!rec.type) rec.type = t.tipo === 'receita' ? 'Receita' : 'Despesa Variável'

          let attempts = 0
          let success = false
          while (attempts < 4 && !success) {
            // 1 initial + 3 retries
            try {
              await pb.collection('transactions').create(rec)
              success = true
            } catch (error) {
              attempts++
              if (attempts >= 4) {
                throw error
              }
              await new Promise((resolve) => setTimeout(resolve, 1000))
            }
          }
          return t
        })

        const results = await Promise.allSettled(promises)

        results.forEach((res, index) => {
          if (res.status === 'fulfilled') {
            successes++
          } else {
            failures.push(batch[index])
          }
        })

        currentProcessed += batch.length
        setSyncProgress({ current: Math.min(currentProcessed, ts.length), total: ts.length })
      }

      if (failures.length === 0) {
        toast({
          title: 'Sucesso!',
          description: `${successes} de ${ts.length} lançamentos importados com sucesso. 0 falharam.`,
        })
      } else {
        toast({
          title: 'Importação concluída com erros',
          description: `${successes} de ${ts.length} lançamentos importados com sucesso. ${failures.length} falharam.`,
          variant: 'destructive',
          action: (
            <ToastAction altText="Tentar novamente" onClick={() => addTransactions(failures)}>
              Tentar novamente
            </ToastAction>
          ),
        })
      }
    } catch (error: any) {
      toast({
        title: 'Erro de Sincronização',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    } finally {
      setIsSyncing(false)
      setSyncProgress(null)
      loadData()
    }

    return { successes, failures }
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
      toast({
        title: 'Erro',
        description: getErrorMessage(error) || 'Falha ao atualizar.',
        variant: 'destructive',
      })
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
      toast({
        title: 'Erro',
        description: getErrorMessage(error) || 'Falha ao excluir.',
        variant: 'destructive',
      })
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
        syncProgress,
        syncData,
      }}
    >
      {children}
    </TransactionContext.Provider>
  )
}
