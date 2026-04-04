import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle, Trash2, CheckCircle2, Layers } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useTransactions } from '@/contexts/TransactionContext'
import { toast } from '@/hooks/use-toast'

interface DuplicateCleanupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DuplicateCleanupModal({ open, onOpenChange }: DuplicateCleanupModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [stats, setStats] = useState<{ count: number; totalAmount: number } | null>(null)
  const { syncData } = useTransactions()

  useEffect(() => {
    if (open) {
      checkDuplicates()
    } else {
      // Reset state when closing
      setStats(null)
    }
  }, [open])

  const checkDuplicates = async () => {
    setIsLoading(true)
    try {
      const res = await pb.send('/backend/v1/transactions/duplicates', {
        method: 'POST',
        body: JSON.stringify({ dryRun: true }),
      })
      setStats(res)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao buscar duplicatas.',
        variant: 'destructive',
      })
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCleanup = async () => {
    setIsDeleting(true)
    try {
      const res = await pb.send('/backend/v1/transactions/duplicates', {
        method: 'POST',
        body: JSON.stringify({ dryRun: false }),
      })
      toast({
        title: 'Sucesso',
        description: `${res.count} duplicatas removidas com sucesso.`,
      })
      await syncData() // Force a global refresh of balances and charts
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao remover duplicatas.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <Layers className="w-5 h-5" />
            Limpeza de Duplicatas
          </DialogTitle>
          <DialogDescription>
            Encontre e remova lançamentos repetidos que possuem exatamente a mesma data, valor e
            descrição.
          </DialogDescription>
        </DialogHeader>

        <div className="py-8 flex flex-col items-center justify-center min-h-[160px]">
          {isLoading ? (
            <div className="flex flex-col items-center text-muted-foreground gap-4 animate-in fade-in zoom-in duration-300">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Analisando base de dados...</p>
            </div>
          ) : stats ? (
            stats.count > 0 ? (
              <div className="flex flex-col items-center gap-4 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-2 shadow-sm">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  {stats.count} duplicatas encontradas
                </h3>
                <p className="text-slate-600 text-base">
                  Totalizando um valor repetido de{' '}
                  <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md ml-1">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(stats.totalAmount)}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground mt-3 max-w-[90%] leading-relaxed">
                  Apenas as cópias redundantes serão apagadas, mantendo um registro original
                  preservado. Esta ação não pode ser desfeita.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2 shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Sua base está limpa!</h3>
                <p className="text-slate-600">
                  Nenhuma duplicata foi encontrada nos seus lançamentos.
                </p>
              </div>
            )
          ) : null}
        </div>

        <DialogFooter className="sm:justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            {stats && stats.count === 0 ? 'Fechar' : 'Cancelar'}
          </Button>
          {stats && stats.count > 0 && (
            <Button
              variant="destructive"
              onClick={handleCleanup}
              disabled={isDeleting}
              className="gap-2 shadow-sm"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Limpando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Confirmar Exclusão
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
