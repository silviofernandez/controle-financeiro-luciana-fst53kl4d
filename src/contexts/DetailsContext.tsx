import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { Detail } from '@/types'
import pb from '@/lib/pocketbase/client'
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
      const data = await pb.collection('details').getFullList<Detail>({ sort: 'name' })
      setDetails(data)
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
      const record = await pb.collection('details').create<Detail>({ user_id: user.id, name })
      return record
    } catch (e) {
      console.error(e)
      return null
    }
  }

  const renameDetail = async (id: string, newName: string, updateTransactions: boolean) => {
    try {
      await pb.send(`/backend/v1/details/${id}/rename`, {
        method: 'POST',
        body: JSON.stringify({ newName, updateTransactions }),
        headers: { 'Content-Type': 'application/json' },
      })
      await fetchDetails()
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  const removeDetail = async (id: string) => {
    try {
      await pb.collection('details').delete(id)
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
