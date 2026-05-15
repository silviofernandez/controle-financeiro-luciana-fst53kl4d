export interface Bill {
  id: string
  user_id: string
  descricao: string
  valor: number
  vencimento: string
  status: 'Pendente' | 'Pago'
  unidade?: string
  category?: string
  banco?: string
  recorrente?: boolean
  recorrencia_dia?: number
  recorrencia_meses?: number
  observacoes?: string
  created: string
  updated: string
}

export type ComputedBillStatus = 'A Vencer' | 'Vence Hoje' | 'Vencido' | 'Pago'
