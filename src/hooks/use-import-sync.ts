import { useState, useEffect, useRef, useCallback } from 'react'
import { updateImportSession } from '@/services/import_sessions'
import { PreviewItem } from '@/components/importer/types'

export function useImportSync(
  sessionId: string | null,
  localItems: PreviewItem[],
  scrollPos: number,
) {
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set())
  const [isSyncing, setIsSyncing] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const markDirty = useCallback((id: string) => {
    setDirtyIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  useEffect(() => {
    if (!sessionId || dirtyIds.size === 0) return

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      setIsSyncing(true)
      const currentDirty = new Set(dirtyIds)
      try {
        await updateImportSession(sessionId, {
          triage_state: localItems,
          last_position: scrollPos,
        })
        setDirtyIds((prev) => {
          const next = new Set(prev)
          currentDirty.forEach((id) => next.delete(id))
          return next
        })
      } catch (e) {
        console.error('Failed to sync import session', e)
      } finally {
        setIsSyncing(false)
      }
    }, 1000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [localItems, sessionId, scrollPos, dirtyIds])

  return {
    isSyncing,
    dirtyIds,
    markDirty,
    hasUnsavedChanges: dirtyIds.size > 0 || isSyncing,
  }
}
