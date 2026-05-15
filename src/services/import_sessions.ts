import { supabase } from '@/lib/supabase/client'
import { PreviewItem } from '@/components/importer/types'

export interface ImportSession {
  id: string
  user_id: string
  file_name: string
  status: 'In Progress' | 'Completed' | 'Interrupted'
  raw_data: PreviewItem[]
  triage_state: PreviewItem[]
  last_position: number
  created: string
  updated: string
}

export const getImportSessions = async () => {
  const { data, error } = await supabase
    .from('import_sessions')
    .select('*')
    .order('created', { ascending: false })
  if (error) throw error
  return data as ImportSession[]
}

export const getActiveImportSession = async () => {
  try {
    const { data, error } = await supabase
      .from('import_sessions')
      .select('*')
      .neq('status', 'Completed')
      .order('created', { ascending: false })
      .limit(1)
      .single()
    if (error) throw error
    return data as ImportSession
  } catch (e) {
    return null
  }
}

export const getImportSessionById = async (id: string) => {
  try {
    const { data, error } = await supabase.from('import_sessions').select('*').eq('id', id).single()
    if (error) throw error
    return data as ImportSession
  } catch (e) {
    return null
  }
}

export const createImportSession = async (data: Partial<ImportSession>) => {
  const { data: res, error } = await supabase.from('import_sessions').insert(data).select().single()
  if (error) throw error
  return res as ImportSession
}

export const updateImportSession = async (id: string, data: Partial<ImportSession>) => {
  const { data: res, error } = await supabase
    .from('import_sessions')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return res as ImportSession
}

export const deleteImportSession = async (id: string) => {
  const { error } = await supabase.from('import_sessions').delete().eq('id', id)
  if (error) throw error
}
