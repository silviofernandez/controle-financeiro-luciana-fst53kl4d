import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useState } from 'react'
import { ImportInput } from './ImportInput'
import { ImportPreview } from './ImportPreview'
import { PreviewItem } from './types'
import { applyAutoTagging, parseValueAndType, guessBank } from '@/lib/import-utils'

export function ImportModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [items, setItems] = useState<PreviewItem[]>([])

  const handleDataParsed = (headers: string[], data: string[][]) => {
    const mapped = data.map((row) => {
      const date = row[0] || new Date().toISOString().split('T')[0]
      const valStr = row[1] || '0'
      const { valor, tipo } = parseValueAndType(valStr)
      const desc = row[2] || ''
      const { category, pbType } = applyAutoTagging(desc)

      return {
        id: crypto.randomUUID(),
        date: date.includes('/') ? date.split('/').reverse().join('-') : date,
        value: valor,
        description: desc,
        category: category || '',
        pbType: pbType || (tipo === 'receita' ? 'Receita' : 'Despesa Variável'),
        unit: 'Geral',
        bank: guessBank(desc),
        triageAction: null,
        splitEmpresaValue: 0,
        splitProlaboreValue: 0,
      } as PreviewItem
    })
    setItems(mapped)
    setStep(2)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setTimeout(() => setStep(1), 300)
      }}
    >
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>Importar Extrato e Triagem</DialogTitle>
          <DialogDescription>
            Classifique suas despesas entre Empresa e Pró-labore antes de salvar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden min-h-0 pt-4">
          {step === 1 ? (
            <ImportInput onDataParsed={handleDataParsed} />
          ) : (
            <ImportPreview
              items={items}
              onBack={() => setStep(1)}
              onComplete={() => onOpenChange(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
