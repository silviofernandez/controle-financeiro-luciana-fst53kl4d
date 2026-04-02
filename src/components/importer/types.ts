import { Banco, Unidade } from '@/types'

export interface PreviewItem {
  id: string
  date: string
  description: string
  value: number
  category: string
  pbType: string
  unit: Unidade
  bank: Banco
  isCheckpoint?: boolean
}
