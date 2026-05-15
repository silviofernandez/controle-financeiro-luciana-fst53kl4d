import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { Detail } from '@/types'
import { supabase } from '@/lib/supabase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from './AuthContext'

interface DetailsContextData {
  details: Detail[]
  addDetail: (name: string) => Promise<Detail | null>
  renameDetail: (id: string, newName: string, updateTransactions: boolean) => Promise<void>
  removeDetail: (id: string) => Promise<void>
  loading: boolean
}

const DetailsContext = createContext<DetailsContextData>({} as DetailsContextData)

export const DetailsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const [details, setDetails] = useState<Detail[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDetails = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase.from('details').select('*').order('name')
      if (error) throw error
      setDetails(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchDetails()
  }, [fetchDetails])

  useRealtime('details', fetchDetails, !!user)

  const addDetail = async (name: string) => {
    if (!user) return null
    try {
      const { data, error } = await supabase
        .from('details')
        .insert({ user_id: user.id, name })
        .select()
        .single()
      if (error) throw error
      return data as Detail
    } catch (e) {
      console.error(e)
      return null
    }
  }

  const renameDetail = async (id: string, newName: string, updateTransactions: boolean) => {
    if (!user) return
    try {
      const { data: detail, error: fetchErr } = await supabase
        .from('details')
        .select('name')
        .eq('id', id)
        .single()

      if (fetchErr) throw fetchErr

      const oldName = detail.name
      const { error: updErr } = await supabase
        .from('details')
        .update({ name: newName })
        .eq('id', id)
      if (updErr) throw updErr

      if (updateTransactions) {
        await supabase
          .from('transactions')
          .update({ category: newName })
          .eq('category', oldName)
          .eq('user_id', user.id)

        await supabase
          .from('transactions')
          .update({ bank: newName })
          .eq('bank', oldName)
          .eq('user_id', user.id)
      }
      await fetchDetails()
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  const removeDetail = async (id: string) => {
    try {
      const { error } = await supabase.from('details').delete().eq('id', id)
      if (error) throw error
      setDetails((prev) => prev.filter((d) => d.id !== id))
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  return (
    <DetailsContext.Provider value={{ details, addDetail, renameDetail, removeDetail, loading }}>
      {children}
    </DetailsContext.Provider>
  )
}

export const useDetails = () => useContext(DetailsContext)
