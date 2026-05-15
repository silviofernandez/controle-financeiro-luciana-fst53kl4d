import { ClientResponseError } from 'pocketbase'

export type FieldErrors = Record<string, string>

export function extractFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ClientResponseError)) return {}
  const data = error.response?.data
  if (!data || typeof data !== 'object') return {}
  const errors: FieldErrors = {}
  for (const [field, detail] of Object.entries(data)) {
    if (
      detail &&
      typeof detail === 'object' &&
      'message' in detail &&
      typeof (detail as { message: unknown }).message === 'string'
    ) {
      errors[field] = (detail as { message: string }).message
    }
  }
  return errors
}

export function getErrorMessage(error: unknown): string {
  if (!error) return 'Erro desconhecido'

  if (error instanceof ClientResponseError) {
    const msgs = Object.values(extractFieldErrors(error))
    return msgs.length > 0 ? msgs.join(' ') : error.message || 'Erro desconhecido'
  }

  if (error instanceof Error) return error.message

  if (typeof error === 'object' && 'message' in error) {
    return String((error as any).message)
  }

  return 'Erro desconhecido'
}
