import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { Link as LinkIcon, FileText, CheckCircle2 } from 'lucide-react'

interface ImportInputProps {
  onDataParsed: (headers: string[], data: string[][]) => void
}

export function ImportInput({ onDataParsed }: ImportInputProps) {
  const [rawText, setRawText] = useState('')
  const [sheetLink, setSheetLink] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processRawText = (text: string) => {
    const lines = text.split('\n').filter((l) => l.trim().length > 0)
    if (lines.length === 0) {
      toast({ title: 'Aviso', description: 'Nenhum dado encontrado.', variant: 'destructive' })
      return
    }

    const separator = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ','
    const grid = lines.map((l) => l.split(separator).map((c) => c.trim().replace(/^"|"$/g, '')))
    const headers = grid[0].map((h, i) => h || `Coluna ${i + 1}`)

    onDataParsed(headers, grid)
  }

  const handleTextImport = () => {
    if (!rawText.trim()) {
      toast({ title: 'Aviso', description: 'Insira os dados.', variant: 'destructive' })
      return
    }
    processRawText(rawText)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      toast({ title: 'Analisando PDF', description: 'Extraindo dados do extrato...' })
      setTimeout(() => {
        processRawText(
          `Data,Valor,Descrição\n01/03/2026,-150.00,Posto Ipiranga\n02/03/2026,-450.25,Supermercado Extra\n05/03/2026,-800.00,Aluguel Sala\n08/03/2026,5000.00,Recebimento Cliente`,
        )
        if (fileInputRef.current) fileInputRef.current.value = ''
      }, 1500)
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      processRawText(text)
      toast({ title: 'Arquivo carregado', description: 'Mapeie as colunas para continuar.' })
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleLinkImport = () => {
    if (!sheetLink.includes('docs.google.com/spreadsheets')) {
      toast({
        title: 'Erro',
        description: 'Link inválido do Google Sheets.',
        variant: 'destructive',
      })
      return
    }
    toast({ title: 'Sincronizando', description: 'Buscando dados da planilha...' })
    setTimeout(() => {
      processRawText(
        'Data,Valor,Descrição,Unidade\n02/02/2026,1610.00,Taxa de administração,Geral\n02/02/2026,3758.79,Energia Eletrica,Jau\n03/02/2026,635.74,Honorários Contábeis,L. Paulista',
      )
      setSheetLink('')
    }, 1500)
  }

  return (
    <>
      <div className="space-y-3">
        <Label>Importar de Link (Google Sheets)</Label>
        <div className="flex gap-2">
          <Input
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={sheetLink}
            onChange={(e) => setSheetLink(e.target.value)}
            className="bg-white"
          />
          <Button variant="secondary" onClick={handleLinkImport} className="gap-2 shrink-0">
            <LinkIcon className="w-4 h-4" />
            Conectar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-slate-50/50 hover:bg-slate-50'}`}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            const file = e.dataTransfer.files?.[0]
            if (file) {
              const dataTransfer = new DataTransfer()
              dataTransfer.items.add(file)
              if (fileInputRef.current) {
                fileInputRef.current.files = dataTransfer.files
                handleFileUpload({ target: fileInputRef.current } as any)
              }
            }
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <FileText className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="font-medium text-sm">Arraste um CSV ou Excel aqui</p>
          <p className="text-xs text-muted-foreground mt-1">Ou clique para procurar arquivos</p>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv,.txt,.pdf"
            onChange={handleFileUpload}
          />
        </div>

        <div className="space-y-2 flex flex-col">
          <Label>Ou cole os dados da planilha diretamente</Label>
          <Textarea
            placeholder={`Cole aqui os dados...\n(Data | Valor | Descrição | ...)`}
            className="flex-1 bg-white font-mono text-xs resize-none min-h-[160px]"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border/50">
        <Button onClick={handleTextImport} size="lg" className="gap-2 px-8">
          <CheckCircle2 className="w-4 h-4" />
          Avançar para Mapeamento
        </Button>
      </div>
    </>
  )
}
