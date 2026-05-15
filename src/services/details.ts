import { supabase } from '@/lib/supabase/client'
import { Detail } from '@/types'

export const getDetails = async () => {
  const { data, error } = await supabase.from('details').select('*').order('name')
  if (error) throw error
  return data as Detail[]
}

export const createDetail = async (data: { user_id: string; name: string }) => {
  const { data: res, error } = await supabase.from('details').insert(data).select().single()
  if (error) throw error
  return res as Detail
}

export const deleteDetail = async (id: string) => {
  const { error } = await supabase.from('details').delete().eq('id', id)
  if (error) throw error
}
