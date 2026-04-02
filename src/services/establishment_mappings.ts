import pb from '@/lib/pocketbase/client'

export interface EstablishmentMapping {
  id?: string
  user_id: string
  name: string
  suggested_category: string
  last_triage_type: 'Empresa' | 'Pró-labore' | 'Dividir'
}

export const getMappings = async () => {
  try {
    return await pb.collection('establishment_mappings').getFullList<EstablishmentMapping>({
      sort: '-updated',
    })
  } catch (e) {
    console.error('Failed to get mappings', e)
    return []
  }
}

export const saveMapping = async (mapping: Omit<EstablishmentMapping, 'id'>) => {
  try {
    const records = await pb
      .collection('establishment_mappings')
      .getFullList<EstablishmentMapping>({
        filter: `name="${mapping.name}" && user_id="${mapping.user_id}"`,
        requestKey: null,
      })

    if (records.length > 0 && records[0].id) {
      return await pb.collection('establishment_mappings').update(records[0].id, mapping)
    }
  } catch (e) {
    // collection might be empty or filter fails
  }

  return await pb.collection('establishment_mappings').create(mapping)
}
