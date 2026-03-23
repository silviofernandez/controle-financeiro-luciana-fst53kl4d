const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export interface CommissionPayload {
  description: string
  total_value: number
  team_id: string
  broker_id: string | null
  capturer_id: string | null
  has_invoice: boolean
  has_legal: boolean
  legal_value: number
  created_at: string
}

export interface CommissionLinePayload {
  commission_id?: string
  role_name: string
  value: number
  created_at: string
}

export const saveCommission = async (
  commission: CommissionPayload,
  lines: CommissionLinePayload[],
) => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('Supabase credentials not found. Simulating save...', { commission, lines })
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return { id: crypto.randomUUID() }
  }

  try {
    const commRes = await fetch(`${SUPABASE_URL}/rest/v1/commissions`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify([commission]),
    })

    if (!commRes.ok) {
      const err = await commRes.text()
      throw new Error(`Failed to save commission: ${err}`)
    }

    const commData = await commRes.json()
    const commissionId = commData[0]?.id

    if (commissionId && lines.length > 0) {
      const linesToInsert = lines.map((l) => ({ ...l, commission_id: commissionId }))
      const linesRes = await fetch(`${SUPABASE_URL}/rest/v1/commission_lines`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(linesToInsert),
      })

      if (!linesRes.ok) {
        const err = await linesRes.text()
        throw new Error(`Failed to save commission lines: ${err}`)
      }
    }

    return { id: commissionId }
  } catch (error) {
    console.error('Supabase save error:', error)
    throw error
  }
}
