import React, { useState, useMemo } from 'react'
import { useTransactions } from '@/contexts/TransactionContext'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GitMerge, Upload, CheckCircle2, AlertCircle, PlusCircle, Check } from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { cn, formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { BANCOS, CATEGORIES, UNIDADES } from '@/types'

interface StatementRow {
  id: string
  date: string
  description: string
  amount: number
  type: 'receita' | 'despesa'
  matchedTransactionId?: string | null
}

const detectBank = (text: string, filename: string) => {
  const t = text.toLowerCase() + filename.toLowerCase()
  if (t.includes('santander')) return 'Santander'
  if (t.includes('inter')) return 'Inter'
  if (t.includes('btg')) return 'BTG'
  if (t.includes('itau') || t.includes('itaú')) return 'Itaú'
  if (t.includes('nubank') || t.includes('nu_')) return 'Nubank'
  if (t.includes('caixa')) return 'Caixa'
  if (t.includes('neon')) return 'Neon'
  return 'Outros'
}

const parseFileContent = async (file: File): Promise<{ rows: StatementRow[]; bank: string }> => {
  const text = await file.text()
  const bank = detectBank(text, file.name)
  let rows: StatementRow[] = []

  if (file.name.toLowerCase().endsWith('.ofx')) {
    const stmtTrnRegex = /<STMTTRN>[\s\S]*?<\/STMTTRN>/g
    const matches = text.match(stmtTrnRegex) || []
    matches.forEach((match) => {
      const dateMatch = match.match(/<DTPOSTED>([0-9]{8})/)
      const amtMatch = match.match(/<TRNAMT>([^<]+)/)
      const memoMatch = match.match(/<MEMO>([^<]+)/)
      if (dateMatch && amtMatch) {
        const yyyy = dateMatch[1].substring(0, 4)
        const mm = dateMatch[1].substring(4, 6)
        const dd = dateMatch[1].substring(6, 8)
        const amt = parseFloat(amtMatch[1])
        const desc = memoMatch ? memoMatch[1].trim() : 'Transação'
        rows.push({
          id: crypto.randomUUID(),
          date: `${yyyy}-${mm}-${dd}`,
          description: desc,
          amount: Math.abs(amt),
          type: amt >= 0 ? 'receita' : 'despesa',
        })
      }
    })
  } else {
    const lines = text.split('\n').filter((l) => l.trim().length > 0)
    const separator = text.includes(';') ? ';' : ','
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(separator).map((p) => p.replace(/(^"|"$)/g, '').trim())
      if (parts.length >= 3) {
        let date = parts[0]
        if (date.includes('/')) {
          const [d, m, y] = date.split('/')
          if (y && y.length === 4) date = `${y}-${m}-${d}`
        }
        const desc = parts[1]
        const amt = parseFloat(parts[2].replace(',', '.'))
        if (!isNaN(amt)) {
          rows.push({
            id: crypto.randomUUID(),
            date,
            description: desc,
            amount: Math.abs(amt),
            type: amt >= 0 ? 'receita' : 'despesa',
          })
        }
      }
    }
  }
  return { rows, bank }
}

const CircularProgress = ({ value }: { value: number }) => {
  const radius = 16
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (value / 100) * circumference
  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg className="w-10 h-10 transform -rotate-90">
        <circle
          className="text-slate-200"
          strokeWidth="3"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="20"
          cy="20"
        />
        <circle
          className={cn(
            'transition-all duration-1000 ease-out',
            value === 100 ? 'text-emerald-500' : 'text-primary',
          )}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="20"
          cy="20"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-slate-700">{Math.round(value)}%</span>
    </div>
  )
}

export default function Reconciliation() {
  const { transactions, updateTransaction, addTransaction } = useTransactions()
  const { user } = useAuth()

  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    d.setDate(0)
    return d.toISOString().split('T')[0]
  })
  const [selectedBank, setSelectedBank] = useState<string>('all')

  const [rawImportedRows, setRawImportedRows] = useState<StatementRow[]>([])
  const [previewRows, setPreviewRows] = useState<StatementRow[]>([])
  const [previewBank, setPreviewBank] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)

  const [creatingFromRow, setCreatingFromRow] = useState<StatementRow | null>(null)
  const [newTx, setNewTx] = useState({ categoria: '', unidade: '', banco: '' })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setIsUploading(true)
    try {
      const { rows, bank } = await parseFileContent(f)
      if (rows.length === 0) throw new Error('Nenhum dado encontrado.')
      setPreviewRows(rows)
      setPreviewBank(bank)
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha ao ler arquivo. Verifique o formato.',
        variant: 'destructive',
      })
    }
    setIsUploading(false)
    e.target.value = ''
  }

  const computedRows = useMemo(() => {
    return rawImportedRows.map((row) => {
      if (row.matchedTransactionId) return { ...row, status: 'grey' as const }

      const candidates = transactions.filter(
        (t) =>
          !t.reconciled_at &&
          t.valor === row.amount &&
          (row.type === 'receita' ? t.tipo === 'receita' : t.tipo !== 'receita'),
      )

      if (candidates.length > 0) {
        let minDiff = Infinity
        let bestId: string | undefined
        for (const c of candidates) {
          const diff = Math.abs(
            differenceInDays(parseISO(c.data.split('T')[0]), parseISO(row.date)),
          )
          if (diff < minDiff) {
            minDiff = diff
            bestId = c.id
          }
        }
        if (minDiff <= 1) return { ...row, status: 'green' as const, suggestedSysId: bestId }
        if (minDiff <= 5) return { ...row, status: 'yellow' as const, suggestedSysId: bestId }
      }
      return { ...row, status: 'red' as const }
    })
  }, [rawImportedRows, transactions])

  const filteredComputedRows = useMemo(() => {
    return computedRows.filter((r) => r.date >= startDate && r.date <= endDate)
  }, [computedRows, startDate, endDate])

  const systemRows = useMemo(() => {
    return transactions
      .filter((t) => {
        const dStr = t.data.split('T')[0]
        if (dStr < startDate || dStr > endDate) return false
        if (selectedBank !== 'all' && t.banco !== selectedBank) return false
        return true
      })
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
  }, [transactions, startDate, endDate, selectedBank])

  const handleAutoReconcile = async () => {
    const greens = filteredComputedRows.filter((r) => r.status === 'green' && r.suggestedSysId)
    if (greens.length === 0) return

    let successes = 0
    const usedSysIds = new Set<string>()
    const newRawRows = [...rawImportedRows]

    for (const row of greens) {
      if (usedSysIds.has(row.suggestedSysId!)) continue
      usedSysIds.add(row.suggestedSysId!)

      try {
        await updateTransaction(row.suggestedSysId!, {
          reconciled_at: new Date().toISOString(),
          reconciled_by: user?.id,
        })
        const idx = newRawRows.findIndex((r) => r.id === row.id)
        if (idx !== -1)
          newRawRows[idx] = { ...newRawRows[idx], matchedTransactionId: row.suggestedSysId! }
        successes++
      } catch {
        /* intentionally ignored */
      }
    }

    setRawImportedRows(newRawRows)
    if (successes > 0)
      toast({
        title: 'Sucesso',
        description: `${successes} transações conciliadas automaticamente.`,
      })
  }

  const handleDrop = async (e: React.DragEvent, sysId: string) => {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-blue-50')
    const rowId = e.dataTransfer.getData('text/plain')
    if (!rowId || !sysId) return

    const sysTx = transactions.find((t) => t.id === sysId)
    if (sysTx?.reconciled_at) return

    try {
      await updateTransaction(sysId, {
        reconciled_at: new Date().toISOString(),
        reconciled_by: user?.id,
      })
      setRawImportedRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, matchedTransactionId: sysId } : r)),
      )
      toast({ title: 'Sucesso', description: 'Transação conciliada manualmente.' })
    } catch {
      /* intentionally ignored */
    }
  }

  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!creatingFromRow) return

    try {
      await addTransaction({
        descricao: creatingFromRow.description,
        valor: creatingFromRow.amount,
        tipo: creatingFromRow.type === 'receita' ? 'receita' : 'despesa_variavel',
        data: creatingFromRow.date,
        categoria: newTx.categoria,
        unidade: newTx.unidade as any,
        banco: (newTx.banco as any) || (selectedBank !== 'all' ? selectedBank : 'Outros'),
      })
      setCreatingFromRow(null)
      toast({
        title: 'Sucesso',
        description: 'Lançamento criado! Ele aparecerá na lista para conciliação.',
      })
    } catch {
      /* intentionally ignored */
    }
  }

  const total = filteredComputedRows.length
  const reconciled = filteredComputedRows.filter((r) => r.status === 'grey').length
  const percentage = total > 0 ? (reconciled / total) * 100 : 0

  if (previewRows.length > 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Prévia da Importação</h2>
            <p className="text-slate-500">
              Foram encontrados {previewRows.length} registros. Banco:{' '}
              <strong>{previewBank}</strong>
            </p>
          </div>
          <div className="space-x-3 shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setPreviewRows([])
                setPreviewBank('')
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setRawImportedRows(previewRows)
                if (BANCOS.includes(previewBank as any)) setSelectedBank(previewBank)
                setPreviewRows([])
                setPreviewBank('')
              }}
            >
              Confirmar Importação
            </Button>
          </div>
        </div>
        <div className="border rounded-md bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.slice(0, 10).map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{format(parseISO(r.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{r.description}</TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-medium',
                      r.type === 'receita' ? 'text-emerald-600' : 'text-red-600',
                    )}
                  >
                    {r.type === 'receita' ? '+' : '-'}
                    {formatCurrency(r.amount)}
                  </TableCell>
                </TableRow>
              ))}
              {previewRows.length > 10 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-slate-500 bg-slate-50">
                    + {previewRows.length - 10} registros ocultos...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto h-[calc(100vh-4rem)] flex flex-col animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <GitMerge className="w-6 h-6 text-primary" /> Conciliação Bancária
          </h1>
          <p className="text-slate-500">
            Sincronize seu extrato bancário com os lançamentos do sistema.
          </p>
        </div>

        {rawImportedRows.length > 0 && (
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full border shadow-sm shrink-0">
            <CircularProgress value={percentage} />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700">
                {reconciled} de {total} itens conciliados
              </span>
              <span className="text-xs text-slate-500">{total - reconciled} pendentes</span>
            </div>
          </div>
        )}
      </div>

      {rawImportedRows.length === 0 ? (
        <Card className="flex-1 flex flex-col items-center justify-center p-12 text-center border-dashed border-2 bg-slate-50/50 shadow-none">
          <div className="bg-blue-100 p-4 rounded-full mb-4">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Importar Extrato</h3>
          <p className="text-slate-500 max-w-md mb-6">
            Selecione um arquivo CSV, OFX ou XLSX exportado do seu banco para iniciar a conciliação
            inteligente.
          </p>
          <div className="relative">
            <input
              type="file"
              accept=".csv,.ofx,.xlsx"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <Button className="pointer-events-none relative z-0">
              {isUploading ? 'Lendo arquivo...' : 'Selecionar Arquivo'}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 space-y-4">
          <Card className="shrink-0 shadow-sm border-blue-100/50">
            <CardContent className="p-4 flex flex-wrap gap-4 items-end">
              <div className="space-y-1.5 flex-1 min-w-[200px]">
                <Label>Banco</Label>
                <Select value={selectedBank} onValueChange={setSelectedBank}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Todos os bancos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os bancos</SelectItem>
                    {BANCOS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 min-w-[150px]">
                <Label>Data Inicial</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="space-y-1.5 min-w-[150px]">
                <Label>Data Final</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="ml-auto flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setRawImportedRows([])}
                  className="flex-1 sm:flex-none"
                >
                  Limpar Sessão
                </Button>
                <Button
                  onClick={handleAutoReconcile}
                  className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Conciliar Auto
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
            {/* Left Panel */}
            <div className="border rounded-md bg-white flex flex-col shadow-sm">
              <div className="bg-slate-50 px-4 py-2 border-b flex justify-between items-center font-semibold text-slate-700 shrink-0">
                Extrato Importado
                <span className="text-xs font-normal text-slate-500 bg-white px-2 py-1 rounded border">
                  Arraste para conciliar
                </span>
              </div>
              <div className="overflow-y-auto flex-1 p-0">
                <Table>
                  <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[80px] text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComputedRows.map((row) => (
                      <TableRow
                        key={row.id}
                        draggable={row.status !== 'grey'}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', row.id)
                          e.currentTarget.classList.add('opacity-50')
                        }}
                        onDragEnd={(e) => e.currentTarget.classList.remove('opacity-50')}
                        className={cn(
                          row.status === 'grey'
                            ? 'opacity-40 bg-slate-50'
                            : 'cursor-grab active:cursor-grabbing hover:bg-slate-50 transition-colors',
                        )}
                      >
                        <TableCell className="font-medium">
                          {format(parseISO(row.date), 'dd/MM')}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={row.description}>
                          {row.description}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-right font-medium whitespace-nowrap',
                            row.type === 'receita' ? 'text-emerald-600' : 'text-red-600',
                          )}
                        >
                          {row.type === 'receita' ? '+' : '-'}
                          {formatCurrency(row.amount)}
                        </TableCell>
                        <TableCell className="text-center p-2">
                          {row.status === 'green' && (
                            <CheckCircle2
                              className="w-5 h-5 text-emerald-500 mx-auto"
                              title="Match perfeito"
                            />
                          )}
                          {row.status === 'yellow' && (
                            <AlertCircle
                              className="w-5 h-5 text-yellow-500 mx-auto"
                              title="Match aproximado"
                            />
                          )}
                          {row.status === 'grey' && (
                            <Check className="w-5 h-5 text-slate-400 mx-auto" title="Conciliado" />
                          )}
                          {row.status === 'red' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setCreatingFromRow(row)}
                              className="h-7 w-7 rounded-full hover:bg-slate-200"
                              title="Criar Lançamento"
                            >
                              <PlusCircle className="w-4 h-4 text-slate-500" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredComputedRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-32 text-slate-500">
                          Nenhum dado importado para o período.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Right Panel */}
            <div className="border rounded-md bg-white flex flex-col shadow-sm">
              <div className="bg-slate-50 px-4 py-2 border-b flex justify-between items-center font-semibold text-slate-700 shrink-0">
                Lançamentos do Sistema
                <span className="text-xs font-normal text-slate-500 bg-white px-2 py-1 rounded border">
                  Solte aqui
                </span>
              </div>
              <div className="overflow-y-auto flex-1 p-0">
                <Table>
                  <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Lançamento</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[80px] text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {systemRows.map((sysTx) => (
                      <TableRow
                        key={sysTx.id}
                        onDragOver={(e) => {
                          e.preventDefault()
                          if (!sysTx.reconciled_at) e.currentTarget.classList.add('bg-blue-50')
                        }}
                        onDragLeave={(e) => e.currentTarget.classList.remove('bg-blue-50')}
                        onDrop={(e) => {
                          e.currentTarget.classList.remove('bg-blue-50')
                          handleDrop(e, sysTx.id)
                        }}
                        className={cn(
                          sysTx.reconciled_at
                            ? 'opacity-40 bg-slate-50'
                            : 'transition-colors hover:bg-slate-50',
                        )}
                      >
                        <TableCell className="font-medium">
                          {format(parseISO(sysTx.data), 'dd/MM')}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="font-medium truncate" title={sysTx.descricao}>
                            {sysTx.descricao}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {sysTx.banco} • {sysTx.categoria}
                          </div>
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-right font-medium whitespace-nowrap',
                            sysTx.tipo === 'receita' ? 'text-emerald-600' : 'text-red-600',
                          )}
                        >
                          {sysTx.tipo === 'receita' ? '+' : '-'}
                          {formatCurrency(sysTx.valor)}
                        </TableCell>
                        <TableCell className="text-center p-2">
                          {sysTx.reconciled_at ? (
                            <Check
                              className="w-5 h-5 text-emerald-500 mx-auto"
                              title="Conciliado"
                            />
                          ) : (
                            <div
                              className="w-5 h-5 mx-auto border-2 border-dashed border-slate-300 rounded-full bg-white"
                              title="Aguardando conciliação"
                            ></div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {systemRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-32 text-slate-500">
                          Nenhum lançamento no período filtrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={!!creatingFromRow} onOpenChange={(v) => !v && setCreatingFromRow(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Lançamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTx} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input
                  value={
                    creatingFromRow ? format(parseISO(creatingFromRow.date), 'dd/MM/yyyy') : ''
                  }
                  disabled
                  className="bg-slate-50 font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Valor</Label>
                <Input
                  value={creatingFromRow ? formatCurrency(creatingFromRow.amount) : ''}
                  disabled
                  className="bg-slate-50 font-medium"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição original</Label>
              <Input
                value={creatingFromRow?.description || ''}
                disabled
                className="bg-slate-50 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select
                  value={newTx.categoria}
                  onValueChange={(v) => setNewTx({ ...newTx, categoria: v })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Unidade</Label>
                <Select
                  value={newTx.unidade}
                  onValueChange={(v) => setNewTx({ ...newTx, unidade: v })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIDADES.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCreatingFromRow(null)}>
                Cancelar
              </Button>
              <Button type="submit" className="shadow-sm">
                Salvar Lançamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
