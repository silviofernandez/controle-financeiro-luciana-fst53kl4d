import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useRealtime(
  collectionName: string,
  callback: (payload: any) => void,
  enabled: boolean = true,
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    const channel = supabase
      .channel(`public:${collectionName}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: collectionName },
        (payload) => {
          callbackRef.current(payload)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [collectionName, enabled])
}

export default useRealtime
