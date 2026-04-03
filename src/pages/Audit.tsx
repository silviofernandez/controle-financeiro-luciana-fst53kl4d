import { useState } from 'react'
import { History, Save } from 'lucide-react'
import { useAudit, Checkpoint } from '@/hooks/use-audit'
import { useTransactions } from '@/contexts/TransactionContext'
import { useAuth } from '@/contexts/AuthContext'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { AuditHistoryTable } from '@/components/audit/AuditHistoryTable'
import { AuditCompareTool } from '@/components/audit/AuditCompareTool'

export default function Audit() {
  const { checkpoints, saveCheckpoint, deleteCheckpoint } = useAudit()
  const { transactions } = useTransactions() || { transactions: [] }
  const { user } = useAuth()
  const { toast } = useToast()

  const [saveName, setSaveName] = useState('')
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [checkpointToRestore, setCheckpointToRestore] = useState<Checkpoint | null>(null)

  const handleSave = () => {
    if (!saveName.trim()) {
      toast({ title: 'Erro', description: 'O nome é obrigatório.', variant: 'destructive' })
      return
    }
    saveCheckpoint(saveName, transactions)
    setSaveName('')
    setSaveDialogOpen(false)
    toast({ title: 'Sucesso', description: 'Checkpoint salvo com sucesso.' })
  }

  const handleRestore = async () => {
    if (!checkpointToRestore) return
    setIsRestoring(true)
    try {
      const current = await pb.collection('transactions').getFullList()
      const currentMap = new Map(current.map((t) => [t.id, t]))
      const cpMap = new Map(checkpointToRestore.transactions.map((t) => [t.id, t]))

      for (const t of current) {
        if (!cpMap.has(t.id)) await pb.collection('transactions').delete(t.id)
      }
      for (const t of checkpointToRestore.transactions) {
        const { id, created, updated, collectionId, collectionName, ...data } = t
        if (!currentMap.has(id)) await pb.collection('transactions').create({ ...data, id })
        else await pb.collection('transactions').update(id, data)
      }
      toast({ title: 'Restaurado', description: 'O checkpoint foi restaurado com sucesso.' })
      setCheckpointToRestore(null)
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e.message || 'Falha ao restaurar.',
        variant: 'destructive',
      })
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-8 h-8 text-primary" /> Auditoria
          </h1>
          <p className="text-slate-500 mt-1">Gerencie, compare e restaure pontos de controle.</p>
        </div>

        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Save className="w-4 h-4" /> Salvar Checkpoint Agora
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Checkpoint</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Checkpoint</Label>
                <Input
                  id="name"
                  placeholder="Ex: Fechamento Jan 2026"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                />
              </div>
              <p className="text-sm text-slate-500">
                Isso salvará os {transactions.length} lançamentos atuais.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Checkpoints</CardTitle>
          <CardDescription>Até 30 checkpoints armazenados localmente (FIFO).</CardDescription>
        </CardHeader>
        <CardContent>
          {checkpoints.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Nenhum checkpoint salvo.</p>
            </div>
          ) : (
            <AuditHistoryTable
              checkpoints={checkpoints}
              user={user}
              currentTransactionsCount={transactions.length}
              deleteCheckpoint={deleteCheckpoint}
              checkpointToRestore={checkpointToRestore}
              setCheckpointToRestore={setCheckpointToRestore}
              handleRestore={handleRestore}
              isRestoring={isRestoring}
            />
          )}
        </CardContent>
      </Card>

      <AuditCompareTool checkpoints={checkpoints} />
    </div>
  )
}
