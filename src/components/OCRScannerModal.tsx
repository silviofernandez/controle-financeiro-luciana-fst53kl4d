import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, ScanLine } from 'lucide-react'
import { performOCR } from '@/lib/ocr'

interface OCRScannerModalProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  onScanComplete: (d: any) => void
}

export function OCRScannerModal({ open, onOpenChange, onScanComplete }: OCRScannerModalProps) {
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const data = await performOCR(file)
      onScanComplete(data)
      onOpenChange(false)
    } catch (err) {
      console.error('OCR Error', err)
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!loading) onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ler Documento Fiscal</DialogTitle>
          <DialogDescription>
            Faça upload de uma foto ou PDF do recibo para extrair os dados automaticamente (Data,
            Estabelecimento, Valor).
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-10 gap-4 min-h-[200px] border-2 border-dashed rounded-lg bg-slate-50 mt-2">
          {loading ? (
            <div className="flex flex-col items-center text-primary gap-4 animate-in fade-in">
              <div className="relative">
                <ScanLine className="w-10 h-10 animate-pulse text-primary/50 absolute" />
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
              <span className="text-sm font-medium animate-pulse">
                Analisando documento via IA...
              </span>
            </div>
          ) : (
            <>
              <Button
                size="lg"
                className="w-[80%] gap-2 shadow-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-5 h-5" /> Enviar Arquivo
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center px-4">
                Formatos suportados: JPG, PNG, PDF. <br />A inteligência artificial fará o
                reconhecimento automático.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,.pdf"
                onChange={handleFileChange}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
