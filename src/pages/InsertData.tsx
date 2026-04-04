import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { TransactionForm } from '@/components/TransactionForm'
import { TransactionList } from '@/components/TransactionList'
import { DashboardSummary } from '@/components/DashboardSummary'
import { ReconciliationAlert } from '@/components/ReconciliationAlert'
import { ImportModal } from '@/components/importer/ImportModal'
import { Button } from '@/components/ui/button'
import { ClipboardPaste, Eraser } from 'lucide-react'
import { AutoSaveControls } from '@/components/AutoSaveControls'
import { LatestCheckpointIndicator } from '@/components/LatestCheckpointIndicator'
import { DuplicateCleanupModal } from '@/components/DuplicateCleanupModal'
import { CardImportModal } from '@/components/importer/CardImportModal'
import { getImportSessionById, getActiveImportSession } from '@/services/import_sessions'
import { CreditCard } from 'lucide-react'

export default function InsertData() {
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false)
  const [isCardImportOpen, setIsCardImportOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const checkActiveSession = async () => {
      const state = location.state as any
      if (state?.resumeSessionId) {
        const session = await getImportSessionById(state.resumeSessionId)
        if (session) {
          localStorage.setItem(
            'autosave_importer_localItems',
            JSON.stringify(session.triage_state || []),
          )
          localStorage.setItem('autosave_importer_step', '2')
          localStorage.setItem('autosave_importer_sessionId', JSON.stringify(session.id))
          localStorage.setItem(
            'autosave_importer_scroll',
            JSON.stringify(session.last_position || 0),
          )
          setIsBulkOpen(true)
          window.history.replaceState({}, document.title) // Clear location state
        }
      } else {
        const hasPending = localStorage.getItem('autosave_importer_localItems')
        if (!hasPending || hasPending === '[]') {
          const active = await getActiveImportSession()
          if (active) {
            localStorage.setItem(
              'autosave_importer_localItems',
              JSON.stringify(active.triage_state || []),
            )
            localStorage.setItem('autosave_importer_step', '2')
            localStorage.setItem('autosave_importer_sessionId', JSON.stringify(active.id))
            localStorage.setItem(
              'autosave_importer_scroll',
              JSON.stringify(active.last_position || 0),
            )
            setIsBulkOpen(true)
          }
        } else if (hasPending && hasPending !== '[]') {
          setIsBulkOpen(true)
        }
      }
    }
    checkActiveSession()
  }, [location.state])

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <ReconciliationAlert key="reconciliation-alert" />

      <div className="flex justify-end gap-3 flex-wrap">
        <Button
          variant="outline"
          onClick={() => setIsDuplicateModalOpen(true)}
          className="gap-2 text-slate-700 hover:text-slate-900 border-slate-300"
        >
          <Eraser className="w-4 h-4" />
          Limpar Duplicatas
        </Button>
        <Button
          onClick={() => setIsCardImportOpen(true)}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <CreditCard className="w-4 h-4" />
          Fatura de Cartão
        </Button>
        <Button
          onClick={() => setIsBulkOpen(true)}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <ClipboardPaste className="w-4 h-4" />
          Extrato Bancário
        </Button>
      </div>

      <LatestCheckpointIndicator />

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:w-[420px] shrink-0 space-y-6">
          <TransactionForm key="transaction-form" />
          <DashboardSummary key="dashboard-summary" />
        </div>
        <div className="flex-1 w-full lg:h-[calc(100vh-8rem)]">
          <TransactionList key="transaction-list" />
        </div>
      </div>

      <ImportModal open={isBulkOpen} onOpenChange={setIsBulkOpen} />
      <CardImportModal open={isCardImportOpen} onOpenChange={setIsCardImportOpen} />
      <DuplicateCleanupModal open={isDuplicateModalOpen} onOpenChange={setIsDuplicateModalOpen} />
      <AutoSaveControls />
    </div>
  )
}
