import { addDays, subDays } from 'date-fns'

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export const toSlug = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '_')
