import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { CreditCard } from '@/types'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from './AuthContext'

interface CreditCardContextData {
  cards: CreditCard[]
  addCard: (c: Omit<CreditCard, 'id' | 'created_at' | 'user_id'>) => Promise<void>
  updateCard: (id: string, c: Partial<CreditCard>) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  isLoading: boolean
}

const CreditCardContext = createContext<CreditCardContextData>({} as CreditCardContextData)

export const useCreditCards = () => useContext(CreditCardContext)

export const CreditCardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [cards, setCards] = useState<CreditCard[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return
    try {
      const records = await pb.collection('credit_cards').getFullList<CreditCard>()
      setCards(records)
    } catch (e) {
      console.error('Error loading cards', e)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime(
    'credit_cards',
    () => {
      loadData()
    },
    !!user,
  )

  const addCard = async (c: Omit<CreditCard, 'id' | 'created_at' | 'user_id'>) => {
    if (!user) return
    setIsLoading(true)
    try {
      await pb.collection('credit_cards').create({ ...c, user_id: user.id })
      toast({ title: 'Sucesso', description: 'Cartão adicionado.' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao adicionar cartão.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const updateCard = async (id: string, c: Partial<CreditCard>) => {
    setIsLoading(true)
    try {
      await pb.collection('credit_cards').update(id, c)
      toast({ title: 'Sucesso', description: 'Cartão atualizado.' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar cartão.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteCard = async (id: string) => {
    setIsLoading(true)
    try {
      await pb.collection('credit_cards').delete(id)
      toast({ title: 'Excluído', description: 'Cartão removido.' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao remover.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <CreditCardContext.Provider value={{ cards, addCard, updateCard, deleteCard, isLoading }}>
      {children}
    </CreditCardContext.Provider>
  )
}
