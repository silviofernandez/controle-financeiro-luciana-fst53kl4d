import { Banco, Unidade } from '@/types'

export type TriageAction = 'Empresa' | 'Pró-labore' | 'Dividir' | 'Já lançado' | null

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
  triageAction: TriageAction
  splitEmpresaValue?: number
  splitProlaboreValue?: number
  isDuplicate?: boolean
  duplicateOverride?: boolean
}
