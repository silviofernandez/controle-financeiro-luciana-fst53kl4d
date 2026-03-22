import React, { useState, useEffect } from 'react'
import { useCommissions } from '@/contexts/CommissionContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { CommissionSummary } from '@/components/CommissionSummary'
import { parseCurrency, formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { Calculator, Users, Save } from 'lucide-react'

export default function Commissions() {
  const { teams } = useCommissions()
  const [valorInput, setValorInput] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')

  const [useTax, setUseTax] = useState(false)
  const [useLegal, setUseLegal] = useState(false)

  const [participantNames, setParticipantNames] = useState<Record<string, string>>({})
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({})

  useEffect(() => {
    const team = teams.find((t) => t.id === selectedTeamId)
    if (team) {
      setUseTax(team.defaultTax)
      setUseLegal(team.defaultLegal)

      const newVars: Record<string, string> = {}
      team.rules.forEach((r) => {
        newVars[r.id] = r.variations[0]?.id || ''
      })
      setSelectedVariations(newVars)
      setParticipantNames({})
    }
  }, [selectedTeamId, teams])

  const grossValue = parseCurrency(valorInput) || 0
  const team = teams.find((t) => t.id === selectedTeamId)

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValorInput(formatCurrency(parseCurrency(e.target.value)))
  }

  const handleSave = () => {
    if (!selectedTeamId || !grossValue) {
      toast({
        title: 'Atenção',
        description: 'Preencha o valor e selecione uma equipe.',
        variant: 'destructive',
      })
      return
    }
    toast({ title: 'Sucesso', description: 'Comissão lançada com sucesso!' })
    setValorInput('')
    setSelectedTeamId('')
    setParticipantNames({})
    setSelectedVariations({})
    setUseTax(false)
    setUseLegal(false)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up p-4 lg:p-0">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 w-full space-y-6">
          <Card className="shadow-md border-blue-100/50">
            <CardHeader className="bg-gradient-to-r from-white to-blue-50/80 pb-4 rounded-t-lg">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl text-slate-800">Lançamento de Comissão</CardTitle>
              </div>
              <CardDescription>
                Calcule e registre o repasse de comissões baseado nas regras da equipe.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Valor Bruto (R$)</Label>
                  <Input
                    value={valorInput}
                    onChange={handleValorChange}
                    placeholder="R$ 0,00"
                    className="font-mono text-lg h-12 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Equipe / Regra</Label>
                  <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                    <SelectTrigger className="h-12 bg-white">
                      <SelectValue placeholder="Selecione a equipe" />
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

              {team && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
                    <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wide flex items-center gap-2">
                      Deduções Base
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="flex items-center space-x-3 bg-white p-3 rounded-md border flex-1 transition-colors hover:border-blue-200">
                        <Switch id="tax" checked={useTax} onCheckedChange={setUseTax} />
                        <div className="space-y-0.5">
                          <Label htmlFor="tax" className="text-sm font-medium cursor-pointer">
                            Nota Fiscal
                          </Label>
                          <p className="text-xs text-muted-foreground">- 15% do valor bruto</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 bg-white p-3 rounded-md border flex-1 transition-colors hover:border-blue-200">
                        <Switch id="legal" checked={useLegal} onCheckedChange={setUseLegal} />
                        <div className="space-y-0.5">
                          <Label htmlFor="legal" className="text-sm font-medium cursor-pointer">
                            Jurídico
                          </Label>
                          <p className="text-xs text-muted-foreground">- R$ 200,00 fixos</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wide flex items-center gap-2 border-b pb-2">
                      <Users className="w-4 h-4" /> Detalhes dos Participantes
                    </h3>
                    <div className="grid gap-4">
                      {team.rules.map((rule) => (
                        <div
                          key={rule.id}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end bg-white p-4 rounded-lg border border-slate-200 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
                        >
                          <div className="space-y-2">
                            <Label className="text-slate-600 font-medium">
                              Nome do {rule.role}
                            </Label>
                            <Input
                              placeholder={`Ex: Nome do profissional`}
                              value={participantNames[rule.id] || ''}
                              onChange={(e) =>
                                setParticipantNames((prev) => ({
                                  ...prev,
                                  [rule.id]: e.target.value,
                                }))
                              }
                              className="bg-slate-50 focus:bg-white transition-colors"
                            />
                          </div>
                          {rule.variations.length > 1 ? (
                            <div className="space-y-2">
                              <Label className="text-slate-600 font-medium">Nível / Variação</Label>
                              <Select
                                value={selectedVariations[rule.id] || ''}
                                onValueChange={(v) =>
                                  setSelectedVariations((prev) => ({ ...prev, [rule.id]: v }))
                                }
                              >
                                <SelectTrigger className="bg-slate-50 focus:bg-white transition-colors">
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
                            <div className="pt-2 pb-2">
                              <span className="text-sm text-slate-500 bg-slate-50 px-3 py-2.5 rounded-md border block w-full">
                                {rule.variations[0]?.name} ({rule.variations[0]?.value}
                                {rule.variations[0]?.type === 'percentage' ? '%' : 'R$'})
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <Button
                className="w-full h-12 text-base font-semibold shadow-md gap-2"
                onClick={handleSave}
                disabled={!team || !grossValue}
              >
                <Save className="w-5 h-5" />
                Registrar Comissão
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="w-full lg:w-[420px] shrink-0">
          {team ? (
            <CommissionSummary
              grossValue={grossValue}
              useTax={useTax}
              useLegal={useLegal}
              team={team}
              selectedVariations={selectedVariations}
              participantNames={participantNames}
            />
          ) : (
            <Card className="shadow-sm border-dashed bg-slate-50/50 h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Calculator className="w-12 h-12 mb-4 text-slate-300" />
              <p className="font-medium text-slate-600 mb-2">Resumo do Repasse</p>
              <p className="text-sm">
                Selecione uma equipe e insira o valor bruto para visualizar a distribuição dos
                valores.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
