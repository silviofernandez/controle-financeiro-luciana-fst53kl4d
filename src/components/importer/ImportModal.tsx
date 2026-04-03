import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState, useEffect } from 'react'
import { ImportInput } from './ImportInput'
import { ImportPreview } from './ImportPreview'
import { PreviewItem } from './types'
import { applyAutoTagging, parseValueAndType, guessBank, applySalaryRule } from '@/lib/import-utils'
import { Unidade } from '@/types'
import { useNavigate } from 'react-router-dom'
import { usePersistentState } from '@/hooks/use-persistent-state'
import { useAuth } from '@/contexts/AuthContext'
import { createImportSession, updateImportSession } from '@/services/import_sessions'

export function ImportModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { user } = useAuth()
  const [step, setStep] = usePersistentState<1 | 2>('importer_step', 1)
  const [localItems, setLocalItems] = usePersistentState<PreviewItem[]>('importer_localItems', [])
  const [sessionId, setSessionId] = usePersistentState<string | null>('importer_sessionId', null)
  const [items, setItems] = useState<PreviewItem[]>([])

  const [conflictItems, setConflictItems] = useState<PreviewItem[] | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (localItems.length === 0 && step === 2 && items.length === 0) {
      setStep(1)
    }
  }, [localItems.length, step, items.length, setStep])

  const handleDataParsed = (finData: string[][] | null, opData: string[][] | null) => {
    const allItems: PreviewItem[] = []

    const processGrid = (data: string[][], source: 'Financeiro' | 'Operacional') => {
      const headers = data[0].map((h) => h.toLowerCase())

      const dateIdx = headers.findIndex((h) => h.includes('data') || h.includes('vencimento'))
      const valIdx = headers.findIndex((h) => h.includes('valor') || h.includes('quantia'))
      const descIdx = headers.findIndex(
        (h) => h.includes('descri') || h.includes('histórico') || h.includes('historico'),
      )
      const unitIdx = headers.findIndex(
        (h) => h.includes('unidade') || h.includes('filial') || h.includes('loja'),
      )
      const catIdx =
        source === 'Financeiro'
          ? headers.findIndex((h) => h.includes('categoria') || h.includes('classificação'))
          : -1
      const bankIdx = headers.findIndex((h) => h.includes('banco'))

      const isLucianaFormat =
        source === 'Operacional' &&
        headers.some((h) => h.includes('jaú') || h.includes('jau')) &&
        headers.some((h) => h.includes('pederneiras'))

      let jauIdx = -1,
        pedIdx = -1,
        lpIdx = -1,
        proIdx = -1
      const genericProLaboreIdx = headers.findIndex(
        (h) => h.includes('pró-labore') || h.includes('pro-labore') || h.includes('pro labore'),
      )

      if (isLucianaFormat) {
        jauIdx = headers.findIndex((h) => h.includes('jaú') || h.includes('jau'))
        pedIdx = headers.findIndex((h) => h.includes('pederneiras'))
        lpIdx = headers.findIndex((h) => h.includes('paulista'))
        proIdx = genericProLaboreIdx
      }

      data.slice(1).forEach((row) => {
        if (row.every((cell) => !cell.trim())) return

        const dateStr = dateIdx >= 0 ? row[dateIdx] : ''
        if (!dateStr) return

        let date = dateStr
        if (date.includes('/')) {
          const parts = date.split('/')
          if (parts.length === 2) {
            const currentYear = new Date().getFullYear()
            date = `${currentYear}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
          } else if (parts.length >= 3) {
            date = `${parts[2].length === 2 ? '20' + parts[2] : parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
          }
        }

        const desc = descIdx >= 0 ? row[descIdx]?.trim() : ''
        if (desc.toUpperCase() === 'SALDO FINANCEIRO') return

        let valor = 0
        let tipo = 'despesa'
        let unit: Unidade = 'Geral'
        let isProLabore = false

        if (isLucianaFormat) {
          const vJau = parseValueAndType(row[jauIdx] || '0').valor
          const vPed = parseValueAndType(row[pedIdx] || '0').valor
          const vLp = parseValueAndType(row[lpIdx] || '0').valor
          const vPro = parseValueAndType(row[proIdx] || '0').valor

          if (vJau > 0) {
            valor = vJau
            unit = 'Jaú'
          } else if (vPed > 0) {
            valor = vPed
            unit = 'Pederneiras'
          } else if (vLp > 0) {
            valor = vLp
            unit = 'Lençóis Paulista'
          } else if (vPro > 0) {
            valor = vPro
            unit = 'Pró-labore (Silvio/Luciana)'
            isProLabore = true
          }

          if (valor === 0) return
        } else {
          const valStr = valIdx >= 0 ? row[valIdx] : '0'
          const parsed = parseValueAndType(valStr)
          valor = parsed.valor
          tipo = parsed.tipo
          if (valor === 0) return

          if (unitIdx >= 0 && row[unitIdx]) {
            const uRaw = row[unitIdx].trim().toLowerCase()
            if (uRaw.includes('ja')) unit = 'Jaú'
            else if (uRaw.includes('pederneiras')) unit = 'Pederneiras'
            else if (uRaw.includes('paulista') || uRaw.includes('len')) unit = 'Lençóis Paulista'
            else if (uRaw.includes('pró') || uRaw.includes('pro'))
              unit = 'Pró-labore (Silvio/Luciana)'
          }

          if (genericProLaboreIdx >= 0 && row[genericProLaboreIdx]) {
            const plVal = row[genericProLaboreIdx].trim().toLowerCase()
            if (plVal === 'sim' || plVal === 'x' || parseFloat(plVal) > 0) {
              isProLabore = true
            }
          }
        }

        let category = 'A triar'
        let pbType =
          source === 'Operacional'
            ? 'Despesa Variável'
            : tipo === 'receita'
              ? 'Receita'
              : 'Despesa Variável'
        const bank = bankIdx >= 0 && row[bankIdx] ? guessBank(row[bankIdx]) : guessBank(desc)

        if (catIdx >= 0 && row[catIdx]) {
          category = row[catIdx].trim() || 'A triar'
        }

        if (isProLabore) {
          category = 'Pró-labore'
          pbType = 'Despesa Fixa'
          unit = 'Pró-labore (Silvio/Luciana)'
        } else if (category === 'A triar') {
          const salCat = applySalaryRule(desc, unit)
          if (salCat) {
            category = salCat
            pbType = 'Despesa Fixa'
          } else {
            const auto = applyAutoTagging(desc)
            if (auto.category) {
              category = auto.category
              pbType = auto.pbType || pbType
            }
          }
        }

        allItems.push({
          id: crypto.randomUUID(),
          date,
          value: valor,
          description: desc,
          category,
          pbType,
          unit,
          bank,
          source,
          triageAction: null,
          splitEmpresaValue: 0,
          splitProlaboreValue: 0,
        })
      })
    }

    if (finData && finData.length > 1) processGrid(finData, 'Financeiro')
    if (opData && opData.length > 1) processGrid(opData, 'Operacional')

    if (localItems.length > 0) {
      setConflictItems(allItems)
    } else {
      setItems(allItems)
      setStep(2)
      if (user) {
        createImportSession({
          user_id: user.id,
          file_name: `Importação ${new Date().toLocaleDateString('pt-BR')}`,
          status: 'In Progress',
          raw_data: allItems,
          triage_state: allItems,
          last_position: 0,
        })
          .then((session) => setSessionId(session.id))
          .catch(console.error)
      }
    }
  }

  const handleDiscardAndStartNew = async () => {
    if (sessionId) {
      try {
        await updateImportSession(sessionId, { status: 'Interrupted' })
      } catch (e) {
        // ignore error
      }
    }

    if (user && conflictItems) {
      try {
        const session = await createImportSession({
          user_id: user.id,
          file_name: `Importação ${new Date().toLocaleDateString('pt-BR')}`,
          status: 'In Progress',
          raw_data: conflictItems,
          triage_state: conflictItems,
          last_position: 0,
        })
        setSessionId(session.id)
      } catch (e) {
        // ignore error
      }
    }

    setLocalItems([])
    if (conflictItems) {
      setItems(conflictItems)
    }
    setStep(2)
    setConflictItems(null)
  }

  const handleResumePending = () => {
    setStep(2)
    setConflictItems(null)
  }

  const handleManualDiscard = () => {
    setLocalItems([])
    setItems([])
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          onOpenChange(o)
        }}
      >
        <DialogContent className="max-w-[95vw] lg:max-w-6xl h-[85vh] flex flex-col p-4 sm:p-6">
          <DialogHeader className="shrink-0">
            <DialogTitle>Importação Dupla e Triagem</DialogTitle>
            <DialogDescription>
              Consolide dados do Financeiro e Operacional simultaneamente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden min-h-0 pt-4">
            {step === 1 ? (
              <ImportInput
                onDataParsed={handleDataParsed}
                hasPending={localItems.length > 0}
                onResume={() => setStep(2)}
                onDiscard={handleManualDiscard}
              />
            ) : (
              <ImportPreview
                items={items}
                localItems={localItems}
                setLocalItems={setLocalItems}
                sessionId={sessionId}
                setSessionId={setSessionId}
                onBack={() => setStep(1)}
                onComplete={() => {
                  setLocalItems([])
                  setStep(1)
                  onOpenChange(false)
                  setTimeout(() => navigate('/relatorios'), 150)
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!conflictItems} onOpenChange={(o) => !o && setConflictItems(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Importação Pendente Encontrada</AlertDialogTitle>
            <AlertDialogDescription>
              Você possui uma importação em andamento que ainda não foi concluída. Deseja continuar
              de onde parou ou descartar os dados antigos e iniciar esta nova importação?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleResumePending}>Continuar Pendente</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscardAndStartNew}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Descartar e Iniciar Nova
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
