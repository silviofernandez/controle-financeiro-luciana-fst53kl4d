import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { PreviewItem } from './types'
import { updateImportSession } from '@/services/import_sessions'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useAuth } from '@/contexts/AuthContext'

interface BatchImportProgressProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: PreviewItem[]
  sessionId: string | null
  onComplete: () => void
}

interface ImportResult {
  item: PreviewItem
  success: boolean
  error?: string
}

export function BatchImportProgress({
  open,
  onOpenChange,
  items,
  sessionId,
  onComplete,
}: BatchImportProgressProps) {
  const { user } = useAuth()
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<ImportResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const processingRef = useRef(false)

  const processBatch = async (
    batch: PreviewItem[],
    onItemProcessed: (res: ImportResult) => void,
  ) => {
    const batchResults: ImportResult[] = []

    for (const item of batch) {
      if (abortControllerRef.current?.signal.aborted) break

      let res: ImportResult

      if (item.triageAction === 'Já lançado') {
        res = { item, success: true }
      } else {
        let transactionsToCreate: any[] = []

        if (item.triageAction === 'Dividir') {
          transactionsToCreate = [
            {
              user_id: user?.id,
              date: item.date,
              description: item.description,
              amount: item.splitEmpresaValue || 0,
              type: item.pbType,
              category: item.category,
              unit: item.unit,
              bank: item.bank,
            },
            {
              user_id: user?.id,
              date: item.date,
              description: `${item.description} (Pró-labore)`,
              amount: item.splitProlaboreValue || 0,
              type: 'Despesa Fixa',
              category: 'Pró-labore',
              unit: 'Pró-labore (Silvio/Luciana)',
              bank: item.bank,
            },
          ]
        } else {
          let category = item.category
          let unit = item.unit
          let type = item.pbType

          if (item.triageAction === 'Pró-labore') {
            category = 'Pró-labore'
            type = 'Despesa Fixa'
            unit = 'Pró-labore (Silvio/Luciana)'
          }

          transactionsToCreate = [
            {
              user_id: user?.id,
              date: item.date,
              description: item.description,
              amount: item.value,
              type,
              category,
              unit,
              bank: item.bank,
            },
          ]
        }

        try {
          for (const tx of transactionsToCreate) {
            let attempts = 0
            let saved = false
            while (attempts < 5 && !saved) {
              if (abortControllerRef.current?.signal.aborted) break
              try {
                await pb.collection('transactions').create(tx)
                saved = true
                setIsWaiting(false)
              } catch (e: any) {
                attempts++
                if (e.status === 429 || e.status === 0) {
                  setIsWaiting(true)
                  const delay = 1000 * Math.pow(2, attempts)
                  await new Promise((resolve) => setTimeout(resolve, delay))
                } else {
                  if (attempts >= 3) throw e
                  await new Promise((resolve) => setTimeout(resolve, 500 * attempts))
                }
              }
            }
          }
          res = { item, success: true }
        } catch (error) {
          setIsWaiting(false)
          res = { item, success: false, error: getErrorMessage(error) }
        }
      }

      batchResults.push(res)
      onItemProcessed(res)
    }

    return batchResults
  }

  const runImport = async (itemsToProcess: PreviewItem[]) => {
    if (processingRef.current) return
    processingRef.current = true
    setIsProcessing(true)
    setIsFinished(false)
    abortControllerRef.current = new AbortController()

    let currentResults: ImportResult[] = [...results.filter((r) => r.success)]
    const BATCH_SIZE = 10
    const total = items.length

    for (let i = 0; i < itemsToProcess.length; i += BATCH_SIZE) {
      if (abortControllerRef.current.signal.aborted) break

      const batch = itemsToProcess.slice(i, i + BATCH_SIZE)

      await processBatch(batch, (res) => {
        currentResults = [...currentResults, res]
        setResults(currentResults)
        setProgress(Math.round((currentResults.length / total) * 100))
      })

      // Mandatory pause between sequential batch processing calls
      await new Promise((resolve) => setTimeout(resolve, 800))

      if (sessionId) {
        let sessionAttempts = 0
        let sessionSaved = false
        while (sessionAttempts < 3 && !sessionSaved) {
          try {
            const successfulIds = new Set(
              currentResults.filter((r) => r.success).map((r) => r.item.id),
            )
            const remainingTriage = items.filter((it) => !successfulIds.has(it.id))
            await updateImportSession(sessionId, {
              triage_state: remainingTriage,
              status: remainingTriage.length === 0 ? 'Completed' : 'In Progress',
            })
            sessionSaved = true
            setIsWaiting(false)
          } catch (e: any) {
            sessionAttempts++
            if (e.status === 429 || e.status === 0) {
              setIsWaiting(true)
              const delay = 1000 * Math.pow(2, sessionAttempts)
              await new Promise((resolve) => setTimeout(resolve, delay))
            } else {
              console.error('Failed to sync session state', e)
              break
            }
          }
        }
      }
    }

    setIsProcessing(false)
    setIsFinished(true)
    setIsWaiting(false)
    processingRef.current = false
    localStorage.removeItem('import_in_progress')
  }

  useEffect(() => {
    if (open && items.length > 0 && !isProcessing && !isFinished && !processingRef.current) {
      setResults([])
      setProgress(0)
      localStorage.setItem('import_in_progress', 'true')
      runImport(items)
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      localStorage.removeItem('import_in_progress')
    }
  }, [open, items])

  const handleRetryFailed = () => {
    const failedItems = results.filter((r) => !r.success).map((r) => r.item)
    setResults(results.filter((r) => r.success))
    setProgress(Math.round((results.filter((r) => r.success).length / items.length) * 100))
    runImport(failedItems)
  }

  const handleClose = () => {
    if (isProcessing) {
      abortControllerRef.current?.abort()
    }
    onComplete()
  }

  const successfulCount = results.filter((r) => r.success).length
  const failedCount = results.filter((r) => !r.success).length
  const totalCount = items.length

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !isProcessing) handleClose()
      }}
    >
      <DialogContent
        className="sm:max-w-xl"
        onInteractOutside={(e) => {
          if (isProcessing) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (isProcessing) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>Importando Transações</DialogTitle>
          <DialogDescription>
            Processando em lotes para garantir a integridade dos dados.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {!isFinished ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>
                  {isWaiting ? (
                    <span className="text-amber-600 flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Aguardando disponibilidade do servidor...
                    </span>
                  ) : (
                    `Importando ${results.length} de ${totalCount}...`
                  )}
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <div className="space-y-4">
              <Alert
                variant={failedCount > 0 ? 'destructive' : 'default'}
                className={failedCount === 0 ? 'bg-green-50 text-green-900 border-green-200' : ''}
              >
                {failedCount > 0 ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <AlertTitle>
                  {failedCount > 0
                    ? 'Importação concluída com erros'
                    : 'Importação concluída com sucesso!'}
                </AlertTitle>
                <AlertDescription>
                  {successfulCount} importados com sucesso / {failedCount} falharam.
                </AlertDescription>
              </Alert>

              {failedCount > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Detalhes das falhas:</h4>
                  <ScrollArea className="h-40 rounded-md border p-2 bg-slate-50">
                    {results
                      .filter((r) => !r.success)
                      .map((r, i) => (
                        <div key={i} className="mb-2 text-sm border-b pb-2 last:border-0">
                          <p className="font-semibold text-slate-800">{r.item.description}</p>
                          <p className="text-red-600">{r.error}</p>
                        </div>
                      ))}
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {isFinished ? (
            <>
              {failedCount > 0 && (
                <Button variant="outline" onClick={handleRetryFailed}>
                  Tentar novamente apenas falhas
                </Button>
              )}
              <Button onClick={handleClose}>Concluir</Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Cancelar'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
