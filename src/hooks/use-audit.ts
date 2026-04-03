import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export interface Checkpoint {
  id: string
  name: string
  timestamp: string
  userId: string
  transactions: any[]
}

export function useAudit() {
  const { user } = useAuth()
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])

  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`finance_checkpoints_${user.id}`)
      if (stored) {
        try {
          setCheckpoints(JSON.parse(stored))
        } catch (e) {
          setCheckpoints([])
        }
      } else {
        setCheckpoints([])
      }
    }
  }, [user?.id])

  const saveCheckpoint = useCallback(
    (name: string, transactions: any[]) => {
      if (!user?.id) return

      const newCp: Checkpoint = {
        id: crypto.randomUUID(),
        name,
        timestamp: new Date().toISOString(),
        userId: user.id,
        transactions: JSON.parse(JSON.stringify(transactions)),
      }

      setCheckpoints((prev) => {
        const updated = [newCp, ...prev]
        if (updated.length > 30) {
          updated.length = 30 // Keep 30 logic (FIFO)
        }
        localStorage.setItem(`finance_checkpoints_${user.id}`, JSON.stringify(updated))
        return updated
      })
    },
    [user?.id],
  )

  const deleteCheckpoint = useCallback(
    (id: string) => {
      if (!user?.id) return
      setCheckpoints((prev) => {
        const updated = prev.filter((c) => c.id !== id)
        localStorage.setItem(`finance_checkpoints_${user.id}`, JSON.stringify(updated))
        return updated
      })
    },
    [user?.id],
  )

  return { checkpoints, saveCheckpoint, deleteCheckpoint }
}
