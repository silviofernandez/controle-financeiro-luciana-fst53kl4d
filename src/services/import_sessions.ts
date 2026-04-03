import pb from '@/lib/pocketbase/client'
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

export const getImportSessions = () =>
  pb.collection('import_sessions').getFullList<ImportSession>({ sort: '-created' })

export const getActiveImportSession = async () => {
  try {
    return await pb
      .collection('import_sessions')
      .getFirstListItem<ImportSession>('status != "Completed"', { sort: '-created' })
  } catch (e) {
    return null
  }
}

export const getImportSessionById = async (id: string) => {
  try {
    return await pb.collection('import_sessions').getOne<ImportSession>(id)
  } catch (e) {
    return null
  }
}

export const createImportSession = (data: Partial<ImportSession>) =>
  pb.collection('import_sessions').create<ImportSession>(data)

export const updateImportSession = (id: string, data: Partial<ImportSession>) =>
  pb.collection('import_sessions').update<ImportSession>(id, data)

export const deleteImportSession = (id: string) => pb.collection('import_sessions').delete(id)
