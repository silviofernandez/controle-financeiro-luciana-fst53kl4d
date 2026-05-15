export type FieldErrors = Record<string, string>

export function extractFieldErrors(error: unknown): FieldErrors {
  return {}
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as any).message)
  }
  return 'An unexpected error occurred.'
}
