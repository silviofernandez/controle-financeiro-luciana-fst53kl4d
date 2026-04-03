import pb from '@/lib/pocketbase/client'
import { Detail } from '@/types'

export const getDetails = () => pb.collection('details').getFullList<Detail>({ sort: 'name' })
export const createDetail = (data: { user_id: string; name: string }) =>
  pb.collection('details').create<Detail>(data)
export const deleteDetail = (id: string) => pb.collection('details').delete(id)
