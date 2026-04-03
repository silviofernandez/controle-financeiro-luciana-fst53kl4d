import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getImportSessions, ImportSession } from '@/services/import_sessions'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Play, Eye, FileText } from 'lucide-react'

export default function Imports() {
  const [sessions, setSessions] = useState<ImportSession[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    getImportSessions().then(setSessions)
  }, [])

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up p-4 sm:p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Histórico de Importações
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas sessões de importação e retome trabalhos pendentes.
          </p>
        </div>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Arquivo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => {
              const total = session.raw_data?.length || 0
              const completed = session.triage_state?.filter((i: any) => i.triageAction).length || 0
              const progress = total > 0 ? Math.round((completed / total) * 100) : 0

              return (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">
                    {format(new Date(session.created), "dd 'de' MMM, yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      {session.file_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        session.status === 'Completed'
                          ? 'default'
                          : session.status === 'In Progress'
                            ? 'secondary'
                            : 'destructive'
                      }
                      className={
                        session.status === 'Completed'
                          ? 'bg-emerald-500 hover:bg-emerald-600'
                          : session.status === 'In Progress'
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-amber-500 hover:bg-amber-600'
                      }
                    >
                      {session.status === 'Completed'
                        ? 'Concluído'
                        : session.status === 'In Progress'
                          ? 'Em Andamento'
                          : 'Interrompido'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium">
                        {completed} / {total} itens
                      </span>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {session.status !== 'Completed' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate('/inserir', { state: { resumeSessionId: session.id } })
                        }
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Retomar
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigate('/relatorios')
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
            {sessions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhuma sessão de importação encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
