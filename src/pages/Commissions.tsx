import { useState, useMemo, useEffect, Fragment } from 'react'
import { useBrokers } from '@/contexts/BrokerContext'
import { useTransactions } from '@/contexts/TransactionContext'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, ChevronDown, ChevronUp, Printer, Trophy, Medal } from 'lucide-react'

interface CommissionParticipant {
  id: string
  corretor_id: string
  nome: string
  papel: 'Corretor' | 'Captador' | 'Gerente' | 'Escritório'
  percentual: number
  valor: number
  status_pagamento: 'Pendente' | 'Pago' | 'Cancelado'
  data_pagamento?: string
}

interface CommissionRecord {
  id: string
  venda_descricao: string
  venda_valor: number
  percentual_total: number
  valor_total: number
  unidade: string
  status_geral: 'Pendente' | 'Parcialmente Pago' | 'Quitado'
  participantes: CommissionParticipant[]
  created_at: string
}

const Podium = ({ ranking }: { ranking: { name: string; amount: number }[] }) => {
  const [first, second, third] = ranking
  return (
    <div className="flex items-end justify-center gap-2 sm:gap-6 py-12">
      {second && (
        <div className="flex flex-col items-center animate-fade-in-up delay-100 w-28 sm:w-32">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-200 rounded-full flex items-center justify-center mb-2 shadow-inner">
            <Medal className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400" />
          </div>
          <div className="text-center mb-2">
            <p className="font-bold text-slate-700 truncate w-full">{second.name}</p>
            <p className="text-xs sm:text-sm text-slate-500">{formatCurrency(second.amount)}</p>
          </div>
          <div className="w-full h-24 sm:h-32 bg-gradient-to-t from-slate-300 to-slate-200 rounded-t-lg flex justify-center pt-2 shadow-lg border-t border-slate-300">
            <span className="text-2xl font-black text-slate-400">2</span>
          </div>
        </div>
      )}
      {first && (
        <div className="flex flex-col items-center z-10 animate-fade-in-up w-32 sm:w-40">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-100 rounded-full flex items-center justify-center mb-2 shadow-inner border-4 border-amber-200">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500" />
          </div>
          <div className="text-center mb-2">
            <p className="font-bold text-amber-600 text-base sm:text-lg truncate w-full">
              {first.name}
            </p>
            <p className="text-xs sm:text-sm font-medium text-amber-700">
              {formatCurrency(first.amount)}
            </p>
          </div>
          <div className="w-full h-32 sm:h-40 bg-gradient-to-t from-amber-300 to-amber-200 rounded-t-lg flex justify-center pt-2 shadow-lg border-t border-amber-300">
            <span className="text-3xl font-black text-amber-600">1</span>
          </div>
        </div>
      )}
      {third && (
        <div className="flex flex-col items-center animate-fade-in-up delay-200 w-28 sm:w-32">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-100 rounded-full flex items-center justify-center mb-2 shadow-inner">
            <Medal className="w-7 h-7 sm:w-8 sm:h-8 text-orange-400" />
          </div>
          <div className="text-center mb-2">
            <p className="font-bold text-slate-700 truncate w-full">{third.name}</p>
            <p className="text-xs sm:text-sm text-slate-500">{formatCurrency(third.amount)}</p>
          </div>
          <div className="w-full h-20 sm:h-24 bg-gradient-to-t from-orange-300 to-orange-200 rounded-t-lg flex justify-center pt-2 shadow-lg border-t border-orange-300">
            <span className="text-2xl font-black text-orange-500">3</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Commissions() {
  const { brokers } = useBrokers()
  const { addTransaction } = useTransactions()

  const [commissions, setCommissions] = useState<CommissionRecord[]>([])
  const [expandedRows, setExpandedRows] = useState<string[]>([])

  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [vendaDescricao, setVendaDescricao] = useState('')
  const [vendaValorRaw, setVendaValorRaw] = useState('0')
  const [percentualTotal, setPercentualTotal] = useState(6)
  const [unidade, setUnidade] = useState('Jaú')

  const [participantesForm, setParticipantesForm] = useState<Partial<CommissionParticipant>[]>([
    {
      id: crypto.randomUUID(),
      corretor_id: '',
      nome: '',
      papel: 'Corretor',
      percentual: 100,
      valor: 0,
    },
  ])

  const [reportBroker, setReportBroker] = useState<string>('')
  const [reportMonth, setReportMonth] = useState<string>(currentMonthStr)

  useEffect(() => {
    fetchCommissions()
  }, [])

  const fetchCommissions = async () => {
    try {
      const { data, error } = await supabase
        .from('comissoes')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      if (data && data.length > 0) {
        setCommissions(data)
        localStorage.setItem('@financeiro:comissoes_v2', JSON.stringify(data))
      } else {
        throw new Error('Empty')
      }
    } catch (error) {
      const local = localStorage.getItem('@financeiro:comissoes_v2')
      if (local) {
        setCommissions(JSON.parse(local))
      } else {
        const mock: CommissionRecord[] = [
          {
            id: crypto.randomUUID(),
            venda_descricao: 'Apartamento Reserva do Bosque',
            venda_valor: 450000,
            percentual_total: 6,
            valor_total: 27000,
            unidade: 'Jaú',
            status_geral: 'Parcialmente Pago',
            created_at: new Date().toISOString(),
            participantes: [
              {
                id: crypto.randomUUID(),
                corretor_id: 'mock-1',
                nome: brokers[0]?.name || 'João Silva',
                papel: 'Corretor',
                percentual: 50,
                valor: 13500,
                status_pagamento: 'Pago',
                data_pagamento: new Date().toISOString(),
              },
              {
                id: crypto.randomUUID(),
                corretor_id: 'mock-2',
                nome: 'Escritório',
                papel: 'Escritório',
                percentual: 50,
                valor: 13500,
                status_pagamento: 'Pendente',
              },
            ],
          },
        ]
        setCommissions(mock)
        localStorage.setItem('@financeiro:comissoes_v2', JSON.stringify(mock))
      }
    }
  }

  const saveCommission = async (newComm: CommissionRecord) => {
    try {
      const { error } = await supabase.from('comissoes').insert([newComm])
      if (error) throw error
    } catch (error) {
      console.warn('Fallback local ao salvar comissão')
    }
    const updated = [newComm, ...commissions]
    setCommissions(updated)
    localStorage.setItem('@financeiro:comissoes_v2', JSON.stringify(updated))
    toast({ title: 'Sucesso', description: 'Comissão registrada.' })
  }

  const updateCommission = async (id: string, updates: Partial<CommissionRecord>) => {
    try {
      const { error } = await supabase.from('comissoes').update(updates).eq('id', id)
      if (error) throw error
    } catch (error) {
      console.warn('Fallback local ao atualizar comissão')
    }
    const updated = commissions.map((c) => (c.id === id ? { ...c, ...updates } : c))
    setCommissions(updated)
    localStorage.setItem('@financeiro:comissoes_v2', JSON.stringify(updated))
  }

  const thisMonthCommissions = useMemo(
    () => commissions.filter((c) => c.created_at.startsWith(currentMonthStr)),
    [commissions, currentMonthStr],
  )

  const { totalPendente, totalPagoThisMonth, highestCommission, topBrokerName, topBrokerValue } =
    useMemo(() => {
      let pendente = 0
      let pago = 0
      let highest = 0
      const earnings: Record<string, number> = {}

      commissions.forEach((c) => {
        if (c.created_at.startsWith(currentMonthStr)) {
          highest = Math.max(highest, c.valor_total)
        }
        c.participantes.forEach((p) => {
          if (p.status_pagamento === 'Pendente') {
            pendente += p.valor
          } else if (
            p.status_pagamento === 'Pago' &&
            p.data_pagamento?.startsWith(currentMonthStr)
          ) {
            pago += p.valor
            if (p.papel === 'Corretor') {
              earnings[p.nome] = (earnings[p.nome] || 0) + p.valor
            }
          }
        })
      })

      let bName = 'Nenhum'
      let bVal = 0
      Object.entries(earnings).forEach(([name, value]) => {
        if (value > bVal) {
          bVal = value
          bName = name
        }
      })

      return {
        totalPendente: pendente,
        totalPagoThisMonth: pago,
        highestCommission: highest,
        topBrokerName: bName,
        topBrokerValue: bVal,
      }
    }, [commissions, currentMonthStr])

  const rankingData = useMemo(() => {
    const stats: Record<string, { sales: number; saleValue: number; amount: number }> = {}
    thisMonthCommissions.forEach((c) => {
      c.participantes.forEach((p) => {
        if (p.papel === 'Corretor' && p.status_pagamento === 'Pago') {
          if (!stats[p.nome]) stats[p.nome] = { sales: 0, saleValue: 0, amount: 0 }
          stats[p.nome].sales += 1
          stats[p.nome].saleValue += c.venda_valor
          stats[p.nome].amount += p.valor
        }
      })
    })
    return Object.entries(stats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
  }, [thisMonthCommissions])

  const vendaValor = Number(vendaValorRaw) / 100
  const valorTotal = vendaValor * (percentualTotal / 100)
  const sumPercentages = participantesForm.reduce((acc, p) => acc + (Number(p.percentual) || 0), 0)

  const handleAddParticipant = () => {
    setParticipantesForm([
      ...participantesForm,
      {
        id: crypto.randomUUID(),
        corretor_id: '',
        nome: '',
        papel: 'Corretor',
        percentual: 0,
        valor: 0,
      },
    ])
  }

  const handleRemoveParticipant = (id: string) => {
    setParticipantesForm(participantesForm.filter((p) => p.id !== id))
  }

  const handleSave = async () => {
    if (sumPercentages !== 100) {
      toast({
        title: 'Erro',
        description: 'A soma dos percentuais dos participantes deve ser 100%.',
        variant: 'destructive',
      })
      return
    }
    if (!vendaDescricao || vendaValor <= 0) {
      toast({ title: 'Erro', description: 'Preencha os dados da venda.', variant: 'destructive' })
      return
    }

    const participantes: CommissionParticipant[] = participantesForm.map((p) => ({
      id: p.id!,
      corretor_id: p.corretor_id!,
      nome: p.nome || 'Não Informado',
      papel: p.papel! as any,
      percentual: p.percentual!,
      valor: valorTotal * ((p.percentual || 0) / 100),
      status_pagamento: 'Pendente',
    }))

    const newComm: CommissionRecord = {
      id: crypto.randomUUID(),
      venda_descricao: vendaDescricao,
      venda_valor: vendaValor,
      percentual_total: percentualTotal,
      valor_total: valorTotal,
      unidade,
      status_geral: 'Pendente',
      participantes,
      created_at: new Date().toISOString(),
    }

    await saveCommission(newComm)

    setVendaDescricao('')
    setVendaValorRaw('0')
    setParticipantesForm([
      {
        id: crypto.randomUUID(),
        corretor_id: '',
        nome: '',
        papel: 'Corretor',
        percentual: 100,
        valor: 0,
      },
    ])
  }

  const handlePayParticipant = async (commId: string, partId: string) => {
    const comm = commissions.find((c) => c.id === commId)
    if (!comm) return

    const updatedParts = comm.participantes.map((p) => {
      if (p.id === partId && p.status_pagamento === 'Pendente') {
        return { ...p, status_pagamento: 'Pago' as const, data_pagamento: new Date().toISOString() }
      }
      return p
    })

    const allPaid = updatedParts.every((p) => p.status_pagamento === 'Pago')
    const anyPaid = updatedParts.some((p) => p.status_pagamento === 'Pago')
    const newStatus = allPaid ? 'Quitado' : anyPaid ? 'Parcialmente Pago' : 'Pendente'

    await updateCommission(commId, { participantes: updatedParts, status_geral: newStatus })

    const participant = updatedParts.find((p) => p.id === partId)
    if (participant) {
      await addTransaction({
        tipo: 'despesa_variavel',
        categoria: 'Comissões Pagas Vendas',
        descricao: `Comissão ${participant.nome} - ${comm.venda_descricao}`,
        valor: participant.valor,
        unidade: comm.unidade as any,
        data: new Date().toISOString(),
        banco: 'Outros',
        classificacao: 'variavel',
      })
      toast({ title: 'Pago', description: 'Participante pago e despesa gerada.' })
    }
  }

  const handlePayAll = async (commId: string) => {
    const comm = commissions.find((c) => c.id === commId)
    if (!comm) return
    for (const p of comm.participantes) {
      if (p.status_pagamento === 'Pendente') {
        await handlePayParticipant(commId, p.id)
      }
    }
  }

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]))
  }

  const reportCommissions = useMemo(() => {
    return commissions
      .flatMap((c) => {
        const parts = c.participantes.filter((p) => p.nome === reportBroker)
        return parts.map((p) => ({
          venda: c.venda_descricao,
          unidade: c.unidade,
          data: c.created_at,
          papel: p.papel,
          valor: p.valor,
          status: p.status_pagamento,
          dataPagamento: p.data_pagamento,
        }))
      })
      .filter((item) => item.data.startsWith(reportMonth))
  }, [commissions, reportBroker, reportMonth])

  const reportTotal = reportCommissions.reduce((acc, r) => acc + r.valor, 0)

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast({ title: 'Aviso', description: 'Por favor, permita pop-ups para imprimir.' })
      return
    }
    const html = `
      <html>
        <head>
          <title>Relatório de Comissões - ${reportBroker}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem; color: #333; }
            h2 { margin-bottom: 0.5rem; color: #111; }
            p { margin-top: 0; color: #666; margin-bottom: 2rem; }
            table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.9rem; }
            th, td { border-bottom: 1px solid #ddd; padding: 12px 8px; text-align: left; }
            th { background: #f8f9fa; font-weight: 600; color: #444; border-top: 2px solid #ddd; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            tfoot td { border-top: 2px solid #ddd; border-bottom: none; font-size: 1rem; }
          </style>
        </head>
        <body>
          <h2>Relatório de Comissões - ${reportBroker}</h2>
          <p>Mês/Ano Ref: ${reportMonth}</p>
          <table>
            <thead>
              <tr>
                <th>Venda</th>
                <th>Data</th>
                <th>Papel</th>
                <th>Status</th>
                <th class="text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${reportCommissions
                .map(
                  (r) => `
                <tr>
                  <td>${r.venda}</td>
                  <td>${new Date(r.data).toLocaleDateString('pt-BR')}</td>
                  <td>${r.papel}</td>
                  <td>${r.status}</td>
                  <td class="text-right">${formatCurrency(r.valor)}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" class="text-right font-bold">Total:</td>
                <td class="text-right font-bold">${formatCurrency(reportTotal)}</td>
              </tr>
            </tfoot>
          </table>
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  return (
    <div className="container max-w-6xl py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Comissões</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalPendente)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pago este mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(totalPagoThisMonth)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Maior Comissão (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(highestCommission)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Corretor Destaque (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 truncate">{topBrokerName}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(topBrokerValue)} em comissões
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="lista">Lançamento e Lista</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios e Ranking</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Nova Comissão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Descrição da Venda</Label>
                  <Input
                    value={vendaDescricao}
                    onChange={(e) => setVendaDescricao(e.target.value)}
                    placeholder="Ex: Casa no Condomínio X"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor da Venda</Label>
                  <Input
                    value={vendaValorRaw === '0' ? '' : formatCurrency(vendaValor)}
                    onChange={(e) => setVendaValorRaw(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <Select value={unidade} onValueChange={setUnidade}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Jaú">Jaú</SelectItem>
                      <SelectItem value="Pederneiras">Pederneiras</SelectItem>
                      <SelectItem value="Lençóis Paulista">Lençóis Paulista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">% Total de Comissão</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={percentualTotal}
                      onChange={(e) => setPercentualTotal(Number(e.target.value))}
                      className="w-24 bg-white"
                    />
                    <span className="font-medium text-lg">%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Valor Total Calculado</Label>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(valorTotal)}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Participantes</h3>
                  <Badge
                    variant={sumPercentages === 100 ? 'default' : 'destructive'}
                    className="text-sm"
                  >
                    Soma: {sumPercentages}%
                  </Badge>
                </div>

                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="w-[250px]">Participante</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead>% do Total ({formatCurrency(valorTotal)})</TableHead>
                        <TableHead>Valor Calculado</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participantesForm.map((p, idx) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <Select
                              value={p.nome}
                              onValueChange={(val) => {
                                const updated = [...participantesForm]
                                updated[idx].nome = val
                                updated[idx].corretor_id =
                                  brokers.find((b) => b.name === val)?.id || ''
                                setParticipantesForm(updated)
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                {brokers.map((b) => (
                                  <SelectItem key={b.id} value={b.name}>
                                    {b.name}
                                  </SelectItem>
                                ))}
                                <SelectItem value="Escritório">Escritório</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={p.papel}
                              onValueChange={(val) => {
                                const updated = [...participantesForm]
                                updated[idx].papel = val as any
                                setParticipantesForm(updated)
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Corretor">Corretor</SelectItem>
                                <SelectItem value="Captador">Captador</SelectItem>
                                <SelectItem value="Gerente">Gerente</SelectItem>
                                <SelectItem value="Escritório">Escritório</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={p.percentual ?? ''}
                                onChange={(e) => {
                                  const updated = [...participantesForm]
                                  updated[idx].percentual = parseFloat(e.target.value) || 0
                                  setParticipantesForm(updated)
                                }}
                                className="w-20"
                              />
                              <span className="text-muted-foreground">%</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-primary">
                            {formatCurrency(valorTotal * ((p.percentual || 0) / 100))}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveParticipant(p.id!)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button
                  variant="outline"
                  className="mt-4 border-dashed"
                  onClick={handleAddParticipant}
                >
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Participante
                </Button>
              </div>

              <Button size="lg" className="w-full" onClick={handleSave}>
                Registrar Comissão
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Comissões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Venda</TableHead>
                      <TableHead>Valor Venda</TableHead>
                      <TableHead>Valor Comissão</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status Geral</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhuma comissão registrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      commissions.map((comm) => (
                        <Fragment key={comm.id}>
                          <TableRow
                            className="cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => toggleRow(comm.id)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {expandedRows.includes(comm.id) ? (
                                  <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                                <span className="font-medium">{comm.venda_descricao}</span>
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(comm.venda_valor)}</TableCell>
                            <TableCell className="text-primary font-medium">
                              {formatCurrency(comm.valor_total)}
                            </TableCell>
                            <TableCell>{comm.unidade}</TableCell>
                            <TableCell>
                              {new Date(comm.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  comm.status_geral === 'Quitado'
                                    ? 'default'
                                    : comm.status_geral === 'Parcialmente Pago'
                                      ? 'secondary'
                                      : 'destructive'
                                }
                              >
                                {comm.status_geral}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {comm.status_geral !== 'Quitado' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handlePayAll(comm.id)
                                  }}
                                >
                                  Pagar Todos
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                          {expandedRows.includes(comm.id) && (
                            <TableRow className="bg-slate-50/50">
                              <TableCell colSpan={7} className="p-0 border-b">
                                <div className="p-4 pl-12 border-l-4 border-l-primary/50">
                                  <h4 className="text-sm font-semibold mb-3 text-slate-600">
                                    Distribuição
                                  </h4>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Participante</TableHead>
                                        <TableHead>Papel</TableHead>
                                        <TableHead>%</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead></TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {comm.participantes.map((p) => (
                                        <TableRow key={p.id}>
                                          <TableCell className="font-medium">{p.nome}</TableCell>
                                          <TableCell>{p.papel}</TableCell>
                                          <TableCell>{p.percentual}%</TableCell>
                                          <TableCell>{formatCurrency(p.valor)}</TableCell>
                                          <TableCell>
                                            <Badge
                                              variant={
                                                p.status_pagamento === 'Pago'
                                                  ? 'default'
                                                  : 'outline'
                                              }
                                            >
                                              {p.status_pagamento}
                                            </Badge>
                                            {p.data_pagamento && (
                                              <span className="text-xs text-muted-foreground ml-2">
                                                {new Date(p.data_pagamento).toLocaleDateString(
                                                  'pt-BR',
                                                )}
                                              </span>
                                            )}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {p.status_pagamento === 'Pendente' && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handlePayParticipant(comm.id, p.id)}
                                              >
                                                Pagar
                                              </Button>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-8">
          <Tabs defaultValue="ranking" className="w-full">
            <TabsList>
              <TabsTrigger value="ranking">Ranking do Mês</TabsTrigger>
              <TabsTrigger value="relatorio">Relatório Individual</TabsTrigger>
            </TabsList>
            <TabsContent value="ranking" className="mt-6">
              <Card>
                <CardHeader className="text-center pb-0">
                  <CardTitle className="text-2xl">Ranking de Corretores</CardTitle>
                  <p className="text-muted-foreground">
                    Baseado em comissões pagas em {reportMonth}
                  </p>
                </CardHeader>
                <CardContent>
                  {rankingData.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      Nenhuma comissão paga este mês.
                    </div>
                  ) : (
                    <>
                      <Podium ranking={rankingData} />
                      <div className="max-w-2xl mx-auto mt-8 border rounded-md">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow>
                              <TableHead className="w-12 text-center">Pos</TableHead>
                              <TableHead>Corretor</TableHead>
                              <TableHead className="text-center">Vendas</TableHead>
                              <TableHead className="text-right">VGV</TableHead>
                              <TableHead className="text-right">Comissões</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rankingData.map((r, i) => (
                              <TableRow key={r.name}>
                                <TableCell className="text-center font-bold text-slate-500">
                                  {i + 1}º
                                </TableCell>
                                <TableCell className="font-medium">{r.name}</TableCell>
                                <TableCell className="text-center">{r.sales}</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(r.saleValue)}
                                </TableCell>
                                <TableCell className="text-right font-bold text-emerald-600">
                                  {formatCurrency(r.amount)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="relatorio" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Relatório de Corretor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-2 w-full sm:w-64">
                      <Label>Corretor</Label>
                      <Select value={reportBroker} onValueChange={setReportBroker}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {brokers.map((b) => (
                            <SelectItem key={b.id} value={b.name}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 w-full sm:w-48">
                      <Label>Mês Referência</Label>
                      <Input
                        type="month"
                        value={reportMonth}
                        onChange={(e) => setReportMonth(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={handlePrint}
                      disabled={!reportBroker || reportCommissions.length === 0}
                      className="w-full sm:w-auto"
                    >
                      <Printer className="w-4 h-4 mr-2" /> Exportar PDF
                    </Button>
                  </div>

                  {reportBroker && (
                    <div className="border rounded-md animate-in fade-in">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead>Venda</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Papel</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportCommissions.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center text-muted-foreground py-8"
                              >
                                Nenhuma comissão encontrada neste período.
                              </TableCell>
                            </TableRow>
                          ) : (
                            reportCommissions.map((r, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium">{r.venda}</TableCell>
                                <TableCell>
                                  {new Date(r.data).toLocaleDateString('pt-BR')}
                                </TableCell>
                                <TableCell>{r.papel}</TableCell>
                                <TableCell>
                                  <Badge variant={r.status === 'Pago' ? 'default' : 'outline'}>
                                    {r.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(r.valor)}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                      {reportCommissions.length > 0 && (
                        <div className="p-4 bg-slate-50 flex justify-between font-bold text-lg border-t">
                          <span>Total:</span>
                          <span className="text-primary">{formatCurrency(reportTotal)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  )
}
