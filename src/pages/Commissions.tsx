import { useState, useEffect, useMemo } from 'react'
import { useCommissions } from '@/contexts/CommissionContext'
import { useTransactions } from '@/contexts/TransactionContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Button } from '@/components/ui/button'
import { parseCurrency, formatCurrency } from '@/lib/utils'
import { CommissionSummary } from '@/components/CommissionSummary'
import { Save } from 'lucide-react'

export default function Commissions() {
  const { teams } = useCommissions()
  const { addTransaction } = useTransactions()

  const [grossValueInput, setGrossValueInput] = useState('')
  const [teamId, setTeamId] = useState<string>('')
  const [useTax, setUseTax] = useState(false)
  const [useLegal, setUseLegal] = useState(false)

  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({})
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({})

  const team = useMemo(() => teams.find((t) => t.id === teamId), [teamId, teams])
  const grossValue = useMemo(() => parseCurrency(grossValueInput) || 0, [grossValueInput])

  useEffect(() => {
    if (team) {
      setUseTax(team.defaultTax)
      setUseLegal(team.defaultLegal)

      const initialVars: Record<string, string> = {}
      team.rules.forEach((rule) => {
        if (rule.variations.length > 0) {
          initialVars[rule.id] = rule.variations[0].id
        }
      })
      setSelectedVariations(initialVars)
    } else {
      setUseTax(false)
      setUseLegal(false)
      setSelectedVariations({})
    }
  }, [team])

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGrossValueInput(formatCurrency(parseCurrency(e.target.value)))
  }

  const handleSaveTransactions = () => {
    if (!team || grossValue <= 0) return

    const today = new Date().toISOString()
    const taxAmount = useTax ? grossValue * 0.15 : 0
    const legalAmount = useLegal ? 200 : 0
    const netBase = Math.max(0, grossValue - taxAmount - legalAmount)

    addTransaction({
      tipo: 'receita',
      descricao: `Comissão Bruta - ${team.name}`,
      valor: grossValue,
      data: today,
      categoria: 'Trabalho',
      unidade: 'Geral',
      banco: 'Santander',
    })

    if (useTax) {
      addTransaction({
        tipo: 'despesa',
        descricao: `Imposto NF (15%) - ${team.name}`,
        valor: taxAmount,
        data: today,
        categoria: 'Impostos',
        unidade: 'Geral',
        banco: 'Santander',
        classificacao: 'variavel',
      })
    }

    if (useLegal) {
      addTransaction({
        tipo: 'despesa',
        descricao: `Despesa Jurídica - ${team.name}`,
        valor: legalAmount,
        data: today,
        categoria: 'Fornecedores',
        unidade: 'Geral',
        banco: 'Santander',
        classificacao: 'variavel',
      })
    }

    team.rules.forEach((rule) => {
      const varId = selectedVariations[rule.id]
      const variation = rule.variations.find((v) => v.id === varId) || rule.variations[0]
      const name = participantNames[rule.id] || 'Não informado'
      const amount =
        variation.type === 'percentage' ? netBase * (variation.value / 100) : variation.value

      if (amount > 0) {
        addTransaction({
          tipo: 'despesa',
          descricao: `Repasse ${rule.role} (${name})`,
          valor: amount,
          data: today,
          categoria: 'Comissões',
          unidade: 'Geral',
          banco: 'Santander',
          classificacao: 'variavel',
        })
      }
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary">Calculadora de Comissões</h2>
        <p className="text-muted-foreground mt-1">
          Calcule repasses automaticamente com base nas regras das equipes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-md">
            <CardHeader className="bg-slate-50/50 pb-4 border-b">
              <CardTitle className="text-lg">Dados da Operação</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Bruto da Comissão</Label>
                  <Input
                    placeholder="R$ 0,00"
                    value={grossValueInput}
                    onChange={handleValorChange}
                    className="text-lg font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Equipe Responsável</Label>
                  <Select value={teamId} onValueChange={setTeamId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma equipe" />
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
              </div>

              <div className="flex gap-8 pt-2">
                <div className="flex items-center space-x-2">
                  <Switch checked={useTax} onCheckedChange={setUseTax} disabled={!team} />
                  <Label>Deduzir Nota Fiscal (15%)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={useLegal} onCheckedChange={setUseLegal} disabled={!team} />
                  <Label>Deduzir Jurídico (R$ 200)</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {team && (
            <Card className="shadow-md">
              <CardHeader className="bg-slate-50/50 pb-4 border-b">
                <CardTitle className="text-lg">Participantes ({team.name})</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {team.rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50/50 p-3 rounded-md border border-slate-100"
                  >
                    <div className="md:col-span-4 space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase">{rule.role}</Label>
                      <Input
                        placeholder="Nome do participante"
                        value={participantNames[rule.id] || ''}
                        onChange={(e) =>
                          setParticipantNames({ ...participantNames, [rule.id]: e.target.value })
                        }
                        className="bg-white h-9"
                      />
                    </div>
                    {rule.variations.length > 1 ? (
                      <div className="md:col-span-8 space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase">
                          Nível / Variação
                        </Label>
                        <Select
                          value={selectedVariations[rule.id]}
                          onValueChange={(val) =>
                            setSelectedVariations({ ...selectedVariations, [rule.id]: val })
                          }
                        >
                          <SelectTrigger className="bg-white h-9">
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
                    ) : (
                      <div className="md:col-span-8 pt-2">
                        <span className="text-sm font-medium text-slate-600 bg-white px-3 py-1.5 rounded-md border inline-block">
                          Fixo em: {rule.variations[0].value}
                          {rule.variations[0].type === 'percentage' ? '%' : 'R$'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {team ? (
            <>
              <CommissionSummary
                grossValue={grossValue}
                useTax={useTax}
                useLegal={useLegal}
                team={team}
                selectedVariations={selectedVariations}
                participantNames={participantNames}
              />
              <Button
                onClick={handleSaveTransactions}
                className="w-full gap-2 h-11"
                disabled={grossValue <= 0}
              >
                <Save className="w-4 h-4" /> Lançar no Financeiro
              </Button>
            </>
          ) : (
            <div className="p-6 border rounded-lg bg-slate-50 text-center text-muted-foreground text-sm">
              Selecione uma equipe para visualizar o resumo da divisão.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
