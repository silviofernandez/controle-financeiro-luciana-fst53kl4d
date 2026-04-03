import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

interface AutoSaveContextData {
  status: 'idle' | 'saving' | 'saved'
  lastSavedAt: Date | null
  triggerSave: () => void
  clearAll: () => void
}

const AutoSaveContext = createContext<AutoSaveContextData>({} as AutoSaveContextData)

export const useAutoSave = () => useContext(AutoSaveContext)

export const AutoSaveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const triggerSave = useCallback(() => {
    setStatus('saving')
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(() => {
      setStatus('saved')
      setLastSavedAt(new Date())
    }, 600) // Provides enough visual feedback duration
  }, [])

  const clearAll = useCallback(() => {
    const keys = Object.keys(localStorage)
    keys.forEach((k) => {
      if (k.startsWith('autosave_')) {
        localStorage.removeItem(k)
      }
    })
    window.location.reload() // Hard reload to clear all active memory state and re-initialize
  }, [])

  return (
    <AutoSaveContext.Provider value={{ status, lastSavedAt, triggerSave, clearAll }}>
      {children}
    </AutoSaveContext.Provider>
  )
}
