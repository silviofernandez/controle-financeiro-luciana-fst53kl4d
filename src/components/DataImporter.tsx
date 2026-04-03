import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { UploadCloud } from 'lucide-react'
import { ImportInput } from './importer/ImportInput'
import { ImportMapping } from './importer/ImportMapping'
import { ImportPreview } from './importer/ImportPreview'
import { PreviewItem } from './importer/types'
import { usePersistentState } from '@/hooks/use-persistent-state'

export function DataImporter() {
  const [step, setStep] = usePersistentState<'input' | 'mapping' | 'preview'>(
    'importer_step',
    'input',
  )
  const [csvHeaders, setCsvHeaders] = usePersistentState<string[]>('importer_csvHeaders', [])
  const [csvData, setCsvData] = usePersistentState<string[][]>('importer_csvData', [])
  const [previewItems, setPreviewItems] = usePersistentState<PreviewItem[]>(
    'importer_previewItems',
    [],
  )

  const handleDataParsed = (headers: string[], data: string[][]) => {
    setCsvHeaders(headers)
    setCsvData(data)
    setStep('mapping')
    localStorage.removeItem('autosave_importer_localItems')
  }

  const handleMappingComplete = (items: PreviewItem[]) => {
    setPreviewItems(items)
    setStep('preview')
    localStorage.removeItem('autosave_importer_localItems')
  }

  const handleImportComplete = () => {
    setStep('input')
    setCsvHeaders([])
    setCsvData([])
    setPreviewItems([])
    localStorage.removeItem('autosave_importer_localItems')
    localStorage.removeItem('autosave_import_finText')
    localStorage.removeItem('autosave_import_opText')
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Card className="shadow-md border-blue-100/50">
        <CardHeader className="bg-gradient-to-r from-white to-blue-50/30 pb-4">
          <CardTitle className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600" />
            Importação Inteligente
          </CardTitle>
          <CardDescription>
            Faça upload de planilhas CSV, cole os dados diretamente ou use um link do Google Sheets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {step === 'input' && <ImportInput onDataParsed={handleDataParsed} />}
          {step === 'mapping' && (
            <ImportMapping
              headers={csvHeaders}
              data={csvData}
              onBack={() => setStep('input')}
              onComplete={handleMappingComplete}
            />
          )}
          {step === 'preview' && (
            <ImportPreview
              items={previewItems}
              onBack={() => setStep('mapping')}
              onComplete={handleImportComplete}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
