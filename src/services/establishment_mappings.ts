import { supabase } from '@/lib/supabase/client'

export interface EstablishmentMapping {
  id?: string
  user_id: string
  name: string
  suggested_category: string
  last_triage_type: 'Empresa' | 'Pró-labore' | 'Dividir'
}

export const getMappings = async () => {
  try {
    const { data, error } = await supabase
      .from('establishment_mappings')
      .select('*')
      .order('updated', { ascending: false })
    if (error) throw error
    return data as EstablishmentMapping[]
  } catch (e) {
    console.error('Failed to get mappings', e)
    return []
  }
}

export const saveMapping = async (mapping: Omit<EstablishmentMapping, 'id'>) => {
  try {
    const { data: records, error: fetchErr } = await supabase
      .from('establishment_mappings')
      .select('id')
      .eq('name', mapping.name)
      .eq('user_id', mapping.user_id)

    if (!fetchErr && records && records.length > 0 && records[0].id) {
      const { data, error } = await supabase
        .from('establishment_mappings')
        .update(mapping)
        .eq('id', records[0].id)
        .select()
        .single()
      if (error) throw error
      return data
    }
  } catch (e) {
    // collection might be empty or filter fails
  }

  const { data, error } = await supabase
    .from('establishment_mappings')
    .insert(mapping)
    .select()
    .single()
  if (error) throw error
  return data
}
