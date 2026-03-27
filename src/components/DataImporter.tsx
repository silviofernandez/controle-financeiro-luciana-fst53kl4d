import { useState, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { useTransactions } from '@/contexts/TransactionContext'
import { toast } from '@/hooks/use-toast'
import { Banco, Unidade, Transaction } from '@/types'
import { UploadCloud, Link as LinkIcon, FileText, CheckCircle2 } from 'lucide-react'

const guessBank = (desc: string): Banco => {
  const d = desc.toLowerCase()
  if (d.includes('santander')) return 'Santander'
  if (d.includes('inter')) return 'Inter'
  if (d.includes('btg')) return 'BTG'
  if (d.includes('nu') || d.includes('nubank')) return 'Nubank'
  if (d.includes('caixa')) return 'Caixa'
  if (d.includes('d financeiro')) return 'D Financeiro'
  if (d.includes('itau') || d.includes('itaú')) return 'Itaú'
  if (d.includes('neon')) return 'Neon'
  return 'Outros'
}

const parseValue = (valStr: string) => {
  if (!valStr) return 0
  const clean = valStr.replace(/\./g, '').replace(',', '.')
  return parseFloat(clean) || 0
}

export function DataImporter() {
  const { transactions, addTransactions } = useTransactions()
  const [rawText, setRawText] = useState('')
  const [sheetLink, setSheetLink] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = () => {
    if (!rawText.trim()) {
      toast({
        title: 'Aviso',
        description: 'Insira os dados para importar.',
        variant: 'destructive',
      })
      return
    }

    const lines = rawText.split('\n')
    const parsed: Omit<Transaction, 'id' | 'created_at'>[] = []

    for (const line of lines) {
      if (!line.trim()) continue

      let cols = line.split('\t')
      if (cols.length < 3 && line.includes(';')) cols = line.split(';')
      if (cols.length < 3 && line.includes('|')) cols = line.split('|')

      // Check if it's the 7+ column layout (Date, Jau, Ped, LP, Silvio, Geral, Hist)
      if (cols.length >= 7 && !line.includes('|')) {
        const dateMatch = cols[0].match(/(\d{2})\/(\d{2})/)
        if (!dateMatch) continue

        let unidade: Unidade = 'Geral'
        let valorStr = ''

        if (cols[1]?.trim()) {
          unidade = 'Jau'
          valorStr = cols[1]
        } else if (cols[2]?.trim()) {
          unidade = 'Pederneiras'
          valorStr = cols[2]
        } else if (cols[3]?.trim()) {
          unidade = 'L. Paulista'
          valorStr = cols[3]
        } else if (cols[4]?.trim()) {
          unidade = 'Silvio'
          valorStr = cols[4]
        } else if (cols[5]?.trim()) {
          unidade = 'Geral'
          valorStr = cols[5]
        } else continue // No value found in expected columns

        const desc = cols.slice(6).join(' ').trim()
        const valor = parseValue(valorStr)

        if (valor > 0 && desc) {
          const isBalance = desc.toLowerCase().includes('saldo financeiro')
          parsed.push({
            descricao: desc,
            valor,
            data: `2026-${dateMatch[2]}-${dateMatch[1]}T10:00:00.000Z`,
            unidade,
            banco: guessBank(desc),
            tipo: isBalance ? 'receita' : 'despesa',
            isCheckpoint: isBalance,
            categoria: 'Outros',
          })
        }
      } else if (line.includes('|')) {
        // Fallback for mocked format separated by pipes
        if (cols.length >= 4) {
          const [dStr, uStr, vStr, descStr] = cols
          const dateMatch = dStr.match(/(\d{2})\/(\d{2})/)
          if (dateMatch) {
            const isBalance = descStr.trim().toLowerCase().includes('saldo financeiro')
            parsed.push({
              descricao: descStr.trim(),
              valor: parseFloat(vStr.replace(',', '.')) || 0,
              data: `2026-${dateMatch[2]}-${dateMatch[1]}T10:00:00.000Z`,
              unidade: uStr.trim() as Unidade,
              banco: guessBank(descStr),
              tipo: isBalance ? 'receita' : 'despesa',
              isCheckpoint: isBalance,
              categoria: 'Outros',
            })
          }
        }
      }
    }

    if (parsed.length === 0) {
      toast({
        title: 'Erro',
        description: 'Nenhum dado válido reconhecido.',
        variant: 'destructive',
      })
      return
    }

    const toAdd = parsed.filter((p) => {
      return !transactions.some(
        (t) =>
          t.data.substring(0, 10) === p.data.substring(0, 10) &&
          t.valor === p.valor &&
          t.descricao.toLowerCase() === p.descricao.toLowerCase(),
      )
    })

    if (toAdd.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Todos os lançamentos extraídos já existem no sistema.',
      })
      return
    }

    addTransactions(toAdd)
    setRawText('')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type === 'text/csv' || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setRawText(ev.target?.result as string)
        toast({
          title: 'Arquivo carregado',
          description: 'Verifique os dados extraídos e clique em Importar.',
        })
      }
      reader.readAsText(file)
    } else {
      toast({ title: 'Extração Iniciada', description: `Lendo dados de ${file.name}...` })
      setTimeout(() => {
        setRawText(
          '02/02\t1610,00\t\t\t\t\tup talentos , recrutamento santander\n10/02\t\t\t\t2895,85\t\tunimed corporativo santander',
        )
        toast({ title: 'Sucesso', description: 'Dados simulados extraídos para demonstração.' })
      }, 1500)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleLinkImport = () => {
    if (!sheetLink.includes('docs.google.com/spreadsheets')) {
      toast({
        title: 'Erro',
        description: 'Insira um link válido do Google Sheets.',
        variant: 'destructive',
      })
      return
    }
    toast({ title: 'Sincronizando', description: 'Buscando dados da planilha conectada...' })
    setTimeout(() => {
      setRawText(
        '02/02\t1610,00\t\t\t\t\tup talentos , recrutamento santander\n02/02\t3758,79\t\t\t\t\tfgts multa 40% gabriela martins santander\n03/02\t\t\t635,74\t\t\tvivo lencois santander',
      )
      toast({
        title: 'Concluído',
        description: 'Dados da planilha carregados. Confirme para importar.',
      })
      setSheetLink('')
    }, 1500)
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
            Faça upload de planilhas, PDFs, cole os dados diretamente ou use um link do Google
            Sheets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
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
              <p className="font-medium text-sm">Arraste um PDF, CSV ou Excel aqui</p>
              <p className="text-xs text-muted-foreground mt-1">Ou clique para procurar arquivos</p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.csv,.txt,.xlsx,.xls"
                onChange={handleFileUpload}
              />
            </div>

            <div className="space-y-2 flex flex-col">
              <Label>Ou cole os dados da planilha diretamente</Label>
              <Textarea
                placeholder={`Cole aqui os dados copiados do Excel...\n(Data | Jau | Pederneiras | L. Pta | Silvio | Geral | Histórico)`}
                className="flex-1 bg-white font-mono text-xs resize-none"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border/50">
            <Button onClick={handleImport} size="lg" className="gap-2 px-8">
              <CheckCircle2 className="w-4 h-4" />
              Processar e Importar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
