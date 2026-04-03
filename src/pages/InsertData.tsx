import { useState } from 'react'
import { TransactionForm } from '@/components/TransactionForm'
import { TransactionList } from '@/components/TransactionList'
import { DashboardSummary } from '@/components/DashboardSummary'
import { ReconciliationAlert } from '@/components/ReconciliationAlert'
import { BulkPasteModal } from '@/components/BulkPasteModal'
import { Button } from '@/components/ui/button'
import { ClipboardPaste } from 'lucide-react'
import { AutoSaveControls } from '@/components/AutoSaveControls'
import { LatestCheckpointIndicator } from '@/components/LatestCheckpointIndicator'

export default function InsertData() {
  const [isBulkOpen, setIsBulkOpen] = useState(false)

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <ReconciliationAlert key="reconciliation-alert" />

      <div className="flex justify-end">
        <Button
          onClick={() => setIsBulkOpen(true)}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <ClipboardPaste className="w-4 h-4" />
          Importação em Lote (Colar Tabela)
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

      <BulkPasteModal open={isBulkOpen} onOpenChange={setIsBulkOpen} />
      <AutoSaveControls />
    </div>
  )
}
