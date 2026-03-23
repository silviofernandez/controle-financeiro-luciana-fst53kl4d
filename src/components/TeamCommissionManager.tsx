import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save } from 'lucide-react'
import { TeamRoleForm } from './TeamRoleForm'
import { TeamRoleList } from './TeamRoleList'
import { TeamsDisplayList } from './TeamsDisplayList'

export interface Role {
  id: string
  name: string
  type: 'Percentual' | 'Valor Fixo'
  value?: number
  levels?: { junior: number; pleno: number; senior: number }
}

export interface Team {
  id: string
  name: string
  taxPercentage: number
  legalFixedValue: number
  roles: Role[]
}

export function TeamCommissionManager() {
  const [teams, setTeams] = useState<Team[]>([])
  const [teamName, setTeamName] = useState('')
  const [taxPercentage, setTaxPercentage] = useState<string>('')
  const [legalFixedValue, setLegalFixedValue] = useState<string>('')
  const [roles, setRoles] = useState<Role[]>([])

  const handleAddRole = (role: Role) => setRoles([...roles, role])
  const handleRemoveRole = (id: string) => setRoles(roles.filter((r) => r.id !== id))

  const handleAddTeam = () => {
    if (!teamName) return
    const newTeam: Team = {
      id: crypto.randomUUID(),
      name: teamName,
      taxPercentage: Number(taxPercentage),
      legalFixedValue: Number(legalFixedValue),
      roles: [...roles],
    }
    setTeams([...teams, newTeam])
    setTeamName('')
    setTaxPercentage('')
    setLegalFixedValue('')
    setRoles([])
  }

  const handleDeleteTeam = (id: string) => setTeams(teams.filter((t) => t.id !== id))

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="shadow-md border-blue-100/50">
        <CardHeader className="bg-gradient-to-r from-white to-blue-50/30 pb-4">
          <CardTitle>Criar Nova Equipe de Comissão</CardTitle>
          <CardDescription>Defina o nome da equipe, deduções e papéis.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nome da Equipe</Label>
              <Input
                placeholder="Ex: Imóveis Usados"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Nota Fiscal (%)</Label>
              <Input
                type="number"
                placeholder="Ex: 15"
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Jurídico (R$)</Label>
              <Input
                type="number"
                placeholder="Ex: 200"
                value={legalFixedValue}
                onChange={(e) => setLegalFixedValue(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>

          <TeamRoleForm onAddRole={handleAddRole} />
          <TeamRoleList roles={roles} onRemoveRole={handleRemoveRole} />

          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleAddTeam}
              className="gap-2 px-8 shadow-sm"
              disabled={!teamName || roles.length === 0}
            >
              <Save className="w-4 h-4" /> Salvar Equipe
            </Button>
          </div>
        </CardContent>
      </Card>

      <TeamsDisplayList teams={teams} onDeleteTeam={handleDeleteTeam} />
    </div>
  )
}
