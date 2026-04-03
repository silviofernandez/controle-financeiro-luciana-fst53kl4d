import { useState, useEffect, useRef, SetStateAction, Dispatch } from 'react'
import { useAutoSave } from '@/contexts/AutoSaveContext'

export function usePersistentState<T>(
  key: string,
  initialValue: T | (() => T),
): [T, Dispatch<SetStateAction<T>>] {
  const { triggerSave } = useAutoSave()
  const prefixedKey = `autosave_${key}`

  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(prefixedKey)
      if (stored) return JSON.parse(stored)
    } catch {
      // Fallback to initial value on parse error
    }
    return initialValue instanceof Function ? initialValue() : initialValue
  })

  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(prefixedKey, JSON.stringify(state))
        triggerSave()
      } catch (e) {
        console.error('Error saving state to localStorage:', e)
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [state, prefixedKey, triggerSave])

  return [state, setState]
}
