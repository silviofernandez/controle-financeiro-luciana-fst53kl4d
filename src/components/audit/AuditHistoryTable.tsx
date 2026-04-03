import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trash2, RotateCcw } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Checkpoint } from '@/hooks/use-audit'

interface AuditHistoryTableProps {
  checkpoints: Checkpoint[]
  user: any
  currentTransactionsCount: number
  deleteCheckpoint: (id: string) => void
  checkpointToRestore: Checkpoint | null
  setCheckpointToRestore: (cp: Checkpoint | null) => void
  handleRestore: () => void
  isRestoring: boolean
}

export function AuditHistoryTable({
  checkpoints,
  user,
  currentTransactionsCount,
  deleteCheckpoint,
  checkpointToRestore,
  setCheckpointToRestore,
  handleRestore,
  isRestoring,
}: AuditHistoryTableProps) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data / Hora</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Lançamentos</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checkpoints.map((cp) => (
            <TableRow key={cp.id}>
              <TableCell>
                {format(parseISO(cp.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </TableCell>
              <TableCell className="font-medium">{cp.name}</TableCell>
              <TableCell>{cp.transactions.length}</TableCell>
              <TableCell>{user?.name || user?.email || cp.userId}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteCheckpoint(cp.id)}
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
                <AlertDialog
                  open={checkpointToRestore?.id === cp.id}
                  onOpenChange={(open) => !open && setCheckpointToRestore(null)}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setCheckpointToRestore(cp)}
                    >
                      <RotateCcw className="w-4 h-4" /> Restaurar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Restaurar Checkpoint</AlertDialogTitle>
                      <AlertDialogDescription>
                        <strong>Atenção:</strong> Você está prestes a restaurar um checkpoint
                        antigo. Isso substituirá os {currentTransactionsCount} lançamentos atuais
                        por {cp.transactions.length} lançamentos da versão anterior. Deseja
                        continuar?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRestore} disabled={isRestoring}>
                        {isRestoring ? 'Restaurando...' : 'Sim, Restaurar'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
