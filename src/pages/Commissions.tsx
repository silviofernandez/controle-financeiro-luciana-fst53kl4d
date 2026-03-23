import { useState, useMemo, useEffect } from 'react'
import { useCommissions } from '@/contexts/CommissionContext'
import { useTransactions } from '@/contexts/TransactionContext'
import { CommissionSummary } from '@/components/CommissionSummary'
import { CommissionSummaryModal, SummaryData } from '@/components/CommissionSummaryModal'
import { saveCommission } from '@/services/supabase'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

export default function Commissions() {
  const { teams } = useCommissions()
  const { addTransaction } = useTransactions()

  const [teamId, setTeamId] = useState<string>(teams[0]?.id || '')
  const [grossValueRaw, setGrossValueRaw] = useState('1000000') // R$ 10.000,00
  const [useTax, setUseTax] = useState(true)
  const [useLegal, setUseLegal] = useState(true)

  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({})
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({})

  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const team = useMemo(() => teams.find((t) => t.id === teamId), [teamId, teams])
  const grossValue = Number(grossValueRaw) / 100

  useEffect(() => {
    if (!team) return
    const initialVars: Record<string, string> = {}
    team.rules.forEach((r) => {
      initialVars[r.id] = r.variations[0]?.id
    })
    setSelectedVariations(initialVars)
    setUseTax(team.defaultTax)
    setUseLegal(team.defaultLegal)
  }, [team])

  const summaryData = useMemo(() => {
    if (!team) return []
    const taxAmount = useTax ? grossValue * 0.15 : 0
    const legalAmount = useLegal ? 200 : 0
    const netBase = Math.max(0, grossValue - taxAmount - legalAmount)

    const data: SummaryData[] = []

    team.rules.forEach((rule) => {
      const varId = selectedVariations[rule.id]
      const variation = rule.variations.find((v) => v.id === varId) || rule.variations[0]
      const name = participantNames[rule.id] || ''

      let amount = 0
      if (variation.type === 'percentage') {
        amount = netBase * (variation.value / 100)
      } else {
        amount = variation.value
      }

      if (amount > 0) {
        data.push({ id: rule.id, role: rule.role, name, value: amount })
      }
    })

    if (taxAmount > 0) {
      data.push({ id: 'impostos', role: 'Impostos', value: taxAmount })
    }
    if (legalAmount > 0) {
      data.push({ id: 'juridico', role: 'Jurídico', value: legalAmount })
    }

    return data
  }, [team, grossValue, useTax, useLegal, selectedVariations, participantNames])

  const handleConfirm = async () => {
    if (!team) return
    setLoading(true)
    try {
      const brokerData = summaryData.find((d) => d.role.toLowerCase().includes('corretor'))
      const capturerData = summaryData.find((d) => d.role.toLowerCase().includes('captador'))

      const commissionData = {
        description: `Comissão ${team.name}`,
        total_value: grossValue,
        team_id: team.id,
        broker_id: brokerData?.name ? crypto.randomUUID() : null,
        capturer_id: capturerData?.name ? crypto.randomUUID() : null,
        has_invoice: useTax,
        has_legal: useLegal,
        legal_value: useLegal ? 200 : 0,
        created_at: new Date().toISOString(),
      }

      const linesData = summaryData.map((item) => ({
        role_name: item.role,
        value: item.value,
        created_at: new Date().toISOString(),
      }))

      await saveCommission(commissionData, linesData)

      // Automated Spreadsheet Update (Context)
      summaryData.forEach((item) => {
        const isTax = item.id === 'impostos'
        const isLegal = item.id === 'juridico'

        addTransaction({
          tipo: 'despesa',
          descricao: isTax
            ? `Imposto Nota Fiscal - ${team.name}`
            : isLegal
              ? `Despesa Jurídica - ${team.name}`
              : `Repasse ${item.role} - ${item.name || team.name}`,
          valor: item.value,
          data: new Date().toISOString(),
          categoria: isTax ? 'Impostos' : isLegal ? 'Fornecedores' : 'Comissão',
          unidade: 'Geral',
          banco: 'Outros',
          classificacao: 'variavel',
        })
      })

      addTransaction({
        tipo: 'receita',
        descricao: `Receita Comissão ${team.name}`,
        valor: grossValue,
        data: new Date().toISOString(),
        categoria: 'Trabalho',
        unidade: 'Geral',
        banco: 'Outros',
      })

      toast({ title: 'Sucesso', description: 'Comissão salva e sincronizada com sucesso!' })
      setModalOpen(false)
      setGrossValueRaw('0')
      setParticipantNames({})
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Falha ao processar a comissão.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!team) return <div className="p-8">Nenhuma equipe cadastrada.</div>

  return (
    <div className="container max-w-6xl py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Nova Comissão</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Básicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Equipe / Regra</Label>
                  <Select value={teamId} onValueChange={setTeamId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor Bruto (R$)</Label>
                  <Input
                    value={formatCurrency(grossValue)}
                    onChange={(e) => setGrossValueRaw(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Switch checked={useTax} onCheckedChange={setUseTax} />
                  <Label>Nota Fiscal (15%)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={useLegal} onCheckedChange={setUseLegal} />
                  <Label>Desp. Jurídica (R$ 200)</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Participantes e Variações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {team.rules.map((rule) => (
                <div
                  key={rule.id}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-2">
                    <Label>{rule.role}</Label>
                    <Input
                      placeholder="Nome (opcional)"
                      value={participantNames[rule.id] || ''}
                      onChange={(e) =>
                        setParticipantNames((prev) => ({ ...prev, [rule.id]: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Variação / Nível</Label>
                    <Select
                      value={selectedVariations[rule.id] || ''}
                      onValueChange={(v) =>
                        setSelectedVariations((prev) => ({ ...prev, [rule.id]: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {rule.variations.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name} ({v.value}
                            {v.type === 'percentage' ? '%' : 'R$'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button size="lg" className="w-full" onClick={() => setModalOpen(true)}>
            Revisar e Lançar Comissão
          </Button>
        </div>

        <div>
          <CommissionSummary
            grossValue={grossValue}
            useTax={useTax}
            useLegal={useLegal}
            team={team}
            selectedVariations={selectedVariations}
            participantNames={participantNames}
          />
        </div>
      </div>

      <CommissionSummaryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        data={summaryData}
        onConfirm={handleConfirm}
        loading={loading}
      />
    </div>
  )
}
