import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { FileText, CheckCircle2, UploadCloud } from 'lucide-react'
import { usePersistentState } from '@/hooks/use-persistent-state'

interface ImportInputProps {
  onDataParsed: (finData: string[][] | null, opData: string[][] | null) => void
}

export function ImportInput({ onDataParsed }: ImportInputProps) {
  const [finText, setFinText] = usePersistentState('import_finText', '')
  const [opText, setOpText] = usePersistentState('import_opText', '')
  const [isDraggingFin, setIsDraggingFin] = useState(false)
  const [isDraggingOp, setIsDraggingOp] = useState(false)

  const finInputRef = useRef<HTMLInputElement>(null)
  const opInputRef = useRef<HTMLInputElement>(null)

  const parseRawText = (text: string) => {
    if (!text.trim()) return null
    const lines = text.split('\n').filter((l) => l.trim().length > 0)
    if (lines.length === 0) return null
    const separator = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ','
    return lines.map((l) => l.split(separator).map((c) => c.trim().replace(/^"|"$/g, '')))
  }

  const handleFile = (file: File, setTarget: (val: string) => void) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setTarget(text)
      toast({
        title: 'Arquivo carregado',
        description: `Dados de ${file.name} extraídos com sucesso.`,
      })
    }
    reader.readAsText(file)
  }

  const handleImport = () => {
    const finData = parseRawText(finText)
    const opData = parseRawText(opText)

    if (!finData && !opData) {
      toast({
        title: 'Aviso',
        description: 'Insira os dados em pelo menos uma das fontes.',
        variant: 'destructive',
      })
      return
    }

    onDataParsed(finData, opData)
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Fonte 1: Financeiro */}
        <div className="flex flex-col border border-slate-200 rounded-lg bg-slate-50/50 overflow-hidden">
          <div className="p-3 bg-blue-50/50 border-b border-blue-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-blue-900 text-sm">Fonte 1: Financeiro (Integrale)</h3>
          </div>
          <div className="p-4 flex-1 flex flex-col gap-4">
            <div
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${isDraggingFin ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-100'}`}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDraggingFin(true)
              }}
              onDragLeave={() => setIsDraggingFin(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDraggingFin(false)
                const file = e.dataTransfer.files?.[0]
                if (file) handleFile(file, setFinText)
              }}
              onClick={() => finInputRef.current?.click()}
            >
              <UploadCloud className="w-6 h-6 text-slate-400 mb-2" />
              <p className="font-medium text-xs text-slate-600">Arraste um CSV ou clique</p>
              <input
                type="file"
                ref={finInputRef}
                className="hidden"
                accept=".csv,.txt"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0], setFinText)
                }}
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <Label className="text-xs text-slate-500">Ou cole os dados diretamente</Label>
              <Textarea
                placeholder="Data | Valor | Descrição | Categoria..."
                className="flex-1 resize-none bg-white font-mono text-[10px] min-h-[120px]"
                value={finText}
                onChange={(e) => setFinText(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Fonte 2: Operacional */}
        <div className="flex flex-col border border-slate-200 rounded-lg bg-slate-50/50 overflow-hidden">
          <div className="p-3 bg-emerald-50/50 border-b border-emerald-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold text-emerald-900 text-sm">
              Fonte 2: Operacional (Luciana)
            </h3>
          </div>
          <div className="p-4 flex-1 flex flex-col gap-4">
            <div
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${isDraggingOp ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-100'}`}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDraggingOp(true)
              }}
              onDragLeave={() => setIsDraggingOp(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDraggingOp(false)
                const file = e.dataTransfer.files?.[0]
                if (file) handleFile(file, setOpText)
              }}
              onClick={() => opInputRef.current?.click()}
            >
              <UploadCloud className="w-6 h-6 text-slate-400 mb-2" />
              <p className="font-medium text-xs text-slate-600">Arraste um CSV ou clique</p>
              <input
                type="file"
                ref={opInputRef}
                className="hidden"
                accept=".csv,.txt"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0], setOpText)
                }}
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <Label className="text-xs text-slate-500">Ou cole os dados diretamente</Label>
              <Textarea
                placeholder="Data | Valor | Descrição | Unidade | Pró-labore..."
                className="flex-1 resize-none bg-white font-mono text-[10px] min-h-[120px]"
                value={opText}
                onChange={(e) => setOpText(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-200 shrink-0">
        <Button onClick={handleImport} size="lg" className="gap-2 px-8">
          <CheckCircle2 className="w-4 h-4" />
          Avançar para Triagem
        </Button>
      </div>
    </div>
  )
}
