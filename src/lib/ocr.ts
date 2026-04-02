import { getMappings } from '@/services/establishment_mappings'

export const performOCR = async (file: File) => {
  // Simulate OCR processing time with external AI vision model
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const isMarket =
    file.name.toLowerCase().includes('mercado') || file.name.toLowerCase().includes('compra')
  const establishment = isMarket ? 'Supermercado Extra' : 'Restaurante Central'
  const amount = isMarket ? 450.25 : 120.0

  let suggestedCategory
  let triageAction

  try {
    const mappings = await getMappings()
    const match = mappings.find((m) => establishment.toLowerCase().includes(m.name.toLowerCase()))

    if (match) {
      suggestedCategory = match.suggested_category
      triageAction = match.last_triage_type
    }
  } catch (e) {
    console.error('Failed to load mappings for OCR', e)
  }

  return {
    date: new Date().toISOString().split('T')[0],
    establishment,
    amount,
    suggestedCategory,
    triageAction,
  }
}
