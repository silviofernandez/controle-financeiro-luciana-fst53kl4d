import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, CheckCircle2, ClipboardPaste, ArrowLeft } from 'lucide-react'
import { useTransactions } from '@/contexts/TransactionContext'
import { toast } from '@/hooks/use-toast'
import { formatCurrency, cn } from '@/lib/utils'
import { Banco, CATEGORIES, Unidade, Transaction } from '@/types'
import { guessBank, parseValueAndType, applyAutoTagging } from '@/lib/import-utils'

export interface BulkItem {
  id: string
  date: string
  amount: number
  unit: Unidade
  description: string
  bank: Banco
  pbType: 'Receita' | 'Despesa Fixa' | 'Despesa Variável'
  category: string
}

export function BulkPasteModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [text, setText] = useState('')
  const [items, setItems] = useState<BulkItem[]>([])
  const [loading, setLoading] = useState(false)
  const { addTransactions } = useTransactions()

  const handleParse = () => {
    const lines = text.split('\n').filter((l) => l.trim().length > 0)
    if (lines.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Insira os dados para importar.',
        variant: 'destructive',
      })
      return
    }

    const isHeader =
      lines[0].toLowerCase().includes('data') && lines[0].toLowerCase().includes('hist')
    const separator = lines[0].includes('\t') ? '\t' : ';'
    const data = lines.map((l) => l.split(separator).map((c) => c.trim()))

    let dateIdx = 0,
      jauIdx = 1,
      pedIdx = 2,
      lpaulistaIdx = 3,
      proLaboreIdx = 4,
      descIdx = 6,
      bankIdx = 7

    let startIndex = 0
    if (isHeader) {
      const h = data[0].map((x) => x.toLowerCase())
      dateIdx = h.findIndex((x) => x.includes('data'))
      jauIdx = h.findIndex((x) => x.includes('jaú') || x.includes('jau'))
      pedIdx = h.findIndex((x) => x.includes('pederneiras'))
      lpaulistaIdx = h.findIndex((x) => x.includes('paulista'))
      proLaboreIdx = h.findIndex((x) => x.includes('pró') || x.includes('pro'))
      descIdx = h.findIndex((x) => x.includes('histórico') || x.includes('historico'))
      bankIdx = h.findIndex((x) => x.includes('banco'))

      if (dateIdx === -1) dateIdx = 0
      if (jauIdx === -1) jauIdx = 1
      if (pedIdx === -1) pedIdx = 2
      if (lpaulistaIdx === -1) lpaulistaIdx = 3
      if (proLaboreIdx === -1) proLaboreIdx = 4
      if (descIdx === -1) descIdx = 6
      if (bankIdx === -1) bankIdx = 7

      startIndex = 1
    }

    const parsedItems: BulkItem[] = []
    const currentYear = new Date().getFullYear()

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i]
      const desc = row[descIdx] || ''

      if (!desc || desc.toUpperCase().includes('SALDO FINANCEIRO')) continue

      let dateStr = row[dateIdx] || ''
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/')
        if (parts.length === 2) {
          dateStr = `${currentYear}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
        } else if (parts.length === 3) {
          const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
          dateStr = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
        }
      }

      let amountStr = ''
      let unit: Unidade = 'Geral'

      if (row[jauIdx]) {
        amountStr = row[jauIdx]
        unit = 'Jaú'
      } else if (row[pedIdx]) {
        amountStr = row[pedIdx]
        unit = 'Pederneiras'
      } else if (row[lpaulistaIdx]) {
        amountStr = row[lpaulistaIdx]
        unit = 'Lençóis Paulista'
      } else if (row[proLaboreIdx]) {
        amountStr = row[proLaboreIdx]
        unit = 'Pró-labore (Silvio/Luciana)'
      }

      const { valor } = parseValueAndType(amountStr)
      if (valor === 0) continue

      const bankStr = row[bankIdx] || ''
      const bank = guessBank(bankStr)

      const auto = applyAutoTagging(desc)

      parsedItems.push({
        id: crypto.randomUUID(),
        date: dateStr,
        amount: valor,
        unit,
        description: desc,
        bank,
        pbType:
          (auto.pbType as 'Receita' | 'Despesa Fixa' | 'Despesa Variável') || 'Despesa Variável',
        category: auto.category || '',
      })
    }

    if (parsedItems.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Nenhum dado válido encontrado para importar.',
        variant: 'destructive',
      })
      return
    }

    setItems(parsedItems)
    setStep(2)
  }

  const handleUpdate = (id: string, field: keyof BulkItem, value: any) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const handleDelete = (id: string) => setItems((prev) => prev.filter((p) => p.id !== id))

  const handleConfirm = async () => {
    if (items.some((i) => !i.category)) {
      toast({
        title: 'Atenção',
        description: 'Preencha a categoria de todos os itens.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    const toAdd: Omit<Transaction, 'id' | 'created_at'>[] = items.map((p) => ({
      descricao: p.description,
      valor: p.amount,
      data: p.date,
      unidade: p.unit,
      banco: p.bank,
      tipo: p.pbType === 'Receita' ? 'receita' : 'despesa',
      classificacao:
        p.pbType === 'Despesa Fixa' ? 'fixo' : p.pbType === 'Despesa Variável' ? 'variavel' : null,
      categoria: p.category,
    }))

    try {
      await addTransactions(toAdd)
      toast({
        title: 'Concluído',
        description: `${toAdd.length} lançamentos importados e triados com sucesso.`,
      })
      onOpenChange(false)
      setTimeout(() => {
        setStep(1)
        setText('')
        setItems([])
      }, 300)
    } catch (e) {
      toast({ title: 'Erro', description: 'Ocorreu um erro ao importar.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o)
          setTimeout(() => {
            setStep(1)
            setText('')
            setItems([])
          }, 300)
      }}
    >
      <DialogContent className="max-w-[95vw] lg:max-w-6xl h-[85vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>Importação em Lote</DialogTitle>
          <DialogDescription>
            Cole dados de planilhas para importar lançamentos rapidamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-0 pt-4 flex flex-col">
          {step === 1 ? (
            <div className="flex flex-col h-full space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-2 shrink-0">
                <h4 className="text-sm font-semibold text-slate-800 mb-2">
                  Formato esperado (Copie do Excel/Google Sheets):
                </h4>
                <div className="overflow-x-auto">
                  <table className="text-xs text-left whitespace-nowrap min-w-full">
                    <thead className="text-slate-500 font-medium">
                      <tr>
                        <th className="pr-4 pb-2">DATA</th>
                        <th className="pr-4 pb-2">JAÚ (R$)</th>
                        <th className="pr-4 pb-2">PEDERNEIRAS (R$)</th>
                        <th className="pr-4 pb-2">L. PAULISTA (R$)</th>
                        <th className="pr-4 pb-2">PRÓ-LABORE</th>
                        <th className="pr-4 pb-2">SALDO FINANCEIRO</th>
                        <th className="pr-4 pb-2">HISTÓRICO</th>
                        <th>BANCO</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      <tr>
                        <td className="pr-4">05/01</td>
                        <td className="pr-4">574.01</td>
                        <td className="pr-4">-</td>
                        <td className="pr-4">-</td>
                        <td className="pr-4">-</td>
                        <td className="pr-4">-</td>
                        <td className="pr-4">vivo ip fixo</td>
                        <td>Santander</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <Textarea
                placeholder="Cole os dados aqui..."
                className="flex-1 resize-none font-mono text-[10px] min-h-[200px]"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="flex justify-end pt-4 shrink-0">
                <Button onClick={handleParse} size="lg" className="gap-2 px-8">
                  <ClipboardPaste className="w-4 h-4" />
                  Avançar para Triagem
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full space-y-4 animate-fade-in">
              <div className="flex justify-between items-center shrink-0">
                <h3 className="text-sm font-medium">Triagem de Dados ({items.length} itens)</h3>
              </div>
              <div className="border rounded-md overflow-x-auto bg-white flex-1">
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                    <TableRow>
                      <TableHead>Data / Unidade</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          <div>{item.date.split('-').reverse().join('/')}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                            {item.unit}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-medium text-slate-800" title={item.description}>
                            {item.description}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {item.bank}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-bold text-xs">
                          {formatCurrency(item.amount)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.pbType}
                            onValueChange={(v: 'Receita' | 'Despesa Fixa' | 'Despesa Variável') =>
                              handleUpdate(item.id, 'pbType', v)
                            }
                          >
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Receita">Receita</SelectItem>
                              <SelectItem value="Despesa Fixa">Despesa Fixa</SelectItem>
                              <SelectItem value="Despesa Variável">Despesa Variável</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.category}
                            onValueChange={(v) => handleUpdate(item.id, 'category', v)}
                          >
                            <SelectTrigger
                              className={cn(
                                'w-[160px] h-8 text-xs',
                                !item.category && 'border-red-300 ring-1 ring-red-200',
                              )}
                            >
                              <SelectValue placeholder="Categoria..." />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum item válido.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-between pt-4 shrink-0">
                <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={loading || items.length === 0}
                  className="gap-2 px-8"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Confirmar e Salvar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
