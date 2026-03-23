import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Team } from './TeamCommissionManager'

interface Props {
  teams: Team[]
  onDeleteTeam: (id: string) => void
}

export function TeamsDisplayList({ teams, onDeleteTeam }: Props) {
  return (
    <div className="space-y-4 pt-4">
      <div>
        <h3 className="text-xl font-bold tracking-tight text-primary">Equipes Configuradas</h3>
        <p className="text-muted-foreground text-sm">
          Lista de todas as equipes e suas respectivas regras ativas.
        </p>
      </div>

      {teams.length === 0 ? (
        <Card className="border-dashed bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <p>Nenhuma equipe foi criada ainda.</p>
            <p className="text-sm mt-1">Utilize o formulário acima para adicionar a primeira.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {teams.map((team) => (
            <Card
              key={team.id}
              className="shadow-sm border-blue-100/30 hover:border-blue-200/50 transition-colors"
            >
              <CardHeader className="bg-slate-50/50 border-b pb-4 pt-5">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-slate-800">{team.name}</CardTitle>
                    <CardDescription className="flex items-center gap-3 mt-2">
                      <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md text-xs font-medium border border-amber-100">
                        Nota Fiscal: {team.taxPercentage}%
                      </span>
                      <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-medium border border-indigo-100">
                        Jurídico: {formatCurrency(team.legalFixedValue)}
                      </span>
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteTeam(team.id)}
                    className="text-red-500 hover:bg-red-50 border-red-100 gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Excluir
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-slate-500">Papel</TableHead>
                      <TableHead className="font-semibold text-slate-500">Tipo</TableHead>
                      <TableHead className="font-semibold text-slate-500">
                        Valor Configurado
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.roles.map((r) => (
                      <TableRow key={r.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium text-slate-700">{r.name}</TableCell>
                        <TableCell className="text-slate-600">{r.type}</TableCell>
                        <TableCell>
                          {r.name.toLowerCase() === 'corretor' && r.levels ? (
                            <div className="flex flex-wrap gap-2 text-xs">
                              <span className="bg-white px-2 py-1 rounded-md border shadow-sm font-medium">
                                Júnior: {r.levels.junior}%
                              </span>
                              <span className="bg-white px-2 py-1 rounded-md border shadow-sm font-medium">
                                Pleno: {r.levels.pleno}%
                              </span>
                              <span className="bg-white px-2 py-1 rounded-md border shadow-sm font-medium">
                                Sênior: {r.levels.senior}%
                              </span>
                            </div>
                          ) : r.type === 'Percentual' ? (
                            <span className="font-medium text-slate-700">{r.value}%</span>
                          ) : (
                            <span className="font-medium text-slate-700">
                              {formatCurrency(r.value || 0)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
