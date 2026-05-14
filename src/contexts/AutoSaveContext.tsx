import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import {
  getActiveImportSession,
  updateImportSession,
  ImportSession,
} from '@/services/import_sessions'
import { useAuth } from './AuthContext'

interface AutoSaveContextData {
  status: 'idle' | 'saving' | 'saved'
  lastSavedAt: Date | null
  triggerSave: () => void
  clearAll: () => void

  // Backend sync properties exposed for import sessions
  activeSession: ImportSession | null
  saveState: (data: Partial<ImportSession>) => Promise<void>
  loadState: () => Promise<ImportSession | null>
}

const AutoSaveContext = createContext<AutoSaveContextData>({} as AutoSaveContextData)

export const useAutoSave = () => useContext(AutoSaveContext)

export const AutoSaveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [activeSession, setActiveSession] = useState<ImportSession | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      getActiveImportSession()
        .then((session) => {
          if (session) setActiveSession(session)
        })
        .catch(console.error)
    } else {
      setActiveSession(null)
    }
  }, [user])

  const triggerSave = useCallback(() => {
    setStatus('saving')
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(() => {
      setStatus('saved')
      setLastSavedAt(new Date())
    }, 600)
  }, [])

  const saveState = useCallback(
    async (data: Partial<ImportSession>) => {
      setStatus('saving')
      try {
        if (activeSession) {
          const updated = await updateImportSession(activeSession.id, data)
          setActiveSession(updated)
        }
        setStatus('saved')
        setLastSavedAt(new Date())
      } catch (error) {
        console.error('Failed to autosave state to backend:', error)
        setStatus('idle')
      }
    },
    [activeSession],
  )

  const loadState = useCallback(async () => {
    if (!user) return null
    try {
      const session = await getActiveImportSession()
      setActiveSession(session)
      return session
    } catch (error) {
      console.error('Failed to load active session:', error)
      return null
    }
  }, [user])

  const clearAll = useCallback(() => {
    // Clear residual local storage to ensure backward compatibility
    const keys = Object.keys(localStorage)
    keys.forEach((k) => {
      if (k.startsWith('autosave_')) {
        localStorage.removeItem(k)
      }
    })

    // Interrupt current session in the backend
    if (activeSession) {
      updateImportSession(activeSession.id, { status: 'Interrupted' })
        .catch(console.error)
        .finally(() => window.location.reload())
    } else {
      window.location.reload()
    }
  }, [activeSession])

  return (
    <AutoSaveContext.Provider
      value={{
        status,
        lastSavedAt,
        triggerSave,
        clearAll,
        activeSession,
        saveState,
        loadState,
      }}
    >
      {children}
    </AutoSaveContext.Provider>
  )
}
