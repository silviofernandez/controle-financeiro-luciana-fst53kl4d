import { useState } from 'react'
import { useCommissions } from '@/contexts/CommissionContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus, Edit2, Trash2, ArrowLeft } from 'lucide-react'
import { CommissionTeamEditor } from './CommissionTeamEditor'

export function CommissionSettings() {
  const { teams, deleteTeam } = useCommissions()
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)

  if (editingTeamId) {
    const teamToEdit = teams.find((t) => t.id === editingTeamId) || {
      id: crypto.randomUUID(),
      name: 'Nova Equipe',
      defaultTax: true,
      defaultLegal: true,
      rules: [],
    }

    return (
      <div className="space-y-4 animate-fade-in">
        <Button variant="ghost" onClick={() => setEditingTeamId(null)} className="gap-2 -ml-3">
          <ArrowLeft className="w-4 h-4" /> Voltar para lista
        </Button>
        <CommissionTeamEditor team={teamToEdit} onDone={() => setEditingTeamId(null)} />
      </div>
    )
  }

  return (
    <Card className="shadow-md border-blue-100/50">
      <CardHeader className="bg-gradient-to-r from-white to-blue-50/30 pb-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle>Equipes e Regras</CardTitle>
          <CardDescription>Configure os percentuais e valores por equipe.</CardDescription>
        </div>
        <Button onClick={() => setEditingTeamId('new')} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Equipe
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {teams.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">Nenhuma equipe configurada.</div>
        ) : (
          <div className="grid gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-white hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{team.name}</h4>
                    <p className="text-xs text-muted-foreground">{team.rules.length} regras</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setEditingTeamId(team.id)}
                    className="h-8 w-8 text-blue-600 hover:text-blue-700"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => deleteTeam(team.id)}
                    className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
