import { useState, useEffect, useRef, useMemo, FormEvent, ChangeEvent } from 'react'
import { useTransactions } from '@/contexts/TransactionContext'
import { useBrokers } from '@/contexts/BrokerContext'
import {
  UNIDADES,
  BANCOS,
  Unidade,
  Banco,
  ClassificacaoDespesa,
  ReceitaTipo,
  Broker,
} from '@/types'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { formatCurrency, parseCurrency } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'

const BANCO_MAP: Record<string, Banco> = {
  santander: 'Santander',
  inter: 'Inter',
  btg: 'BTG',
  caixa: 'Caixa',
  nubank: 'Nubank',
  nu: 'Nubank',
  'd financeiro': 'D Financeiro',
  dfinanceiro: 'D Financeiro',
  itau: 'Itaú',
  itaú: 'Itaú',
  neon: 'Neon',
}

function BrokerSelectField({
  label,
  value,
  onChange,
  brokers,
  nivel,
  onNivelChange,
  pct,
  onPctChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  brokers: Broker[]
  nivel: string
  onNivelChange: (v: string) => void
  pct: string
  onPctChange: (v: string) => void
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nao_informado">Não informado</SelectItem>
            {brokers.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {value && value !== 'nao_informado' && (
        <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nível</Label>
            <Select value={nivel} onValueChange={onNivelChange}>
              <SelectTrigger className="bg-white h-8 text-xs">
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Júnior">Júnior</SelectItem>
                <SelectItem value="Pleno">Pleno</SelectItem>
                <SelectItem value="Sênior">Sênior</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Porcentagem (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={pct}
              onChange={(e) => onPctChange(e.target.value)}
              className="bg-white h-8 text-xs font-mono"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function TransactionForm() {
  const { addTransaction, transactions } = useTransactions()
  const { brokers } = useBrokers()

  const [tipo, setTipo] = useState<'receita' | 'despesa'>('despesa')
  const [classificacao, setClassificacao] = useState<ClassificacaoDespesa>('variavel')
  const [receitaTipo, setReceitaTipo] = useState<ReceitaTipo>('outro')
  const [descricao, setDescricao] = useState('')
  const [valorInput, setValorInput] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [unidade, setUnidade] = useState<Unidade>('Geral')
  const [banco, setBanco] = useState<Banco>('Outros')
  const [isCheckpoint, setIsCheckpoint] = useState(false)
  const [loading, setLoading] = useState(false)

  // Commission fields
  const [corretor, setCorretor] = useState('')
  const [corretorNivel, setCorretorNivel] = useState('')
  const [corretorPorcentagem, setCorretorPorcentagem] = useState('')

  const [captador, setCaptador] = useState('')
  const [captadorNivel, setCaptadorNivel] = useState('')
  const [captadorPorcentagem, setCaptadorPorcentagem] = useState('')

  const [notaFiscal, setNotaFiscal] = useState(false)
  const [juridico, setJuridico] = useState(false)
  const [juridicoValorInput, setJuridicoValorInput] = useState(() => formatCurrency(200))

  const [showSuggestions, setShowSuggestions] = useState(false)
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const despesaDescriptions = useMemo(() => {
    const despesas = transactions.filter((t) => t.tipo === 'despesa')
    const descriptions = despesas.map((t) => t.descricao.trim())
    return Array.from(new Set(descriptions))
  }, [transactions])

  const suggestions = useMemo(() => {
    if (tipo !== 'despesa' || !descricao) return []
    const lowerInput = descricao.toLowerCase()
    return despesaDescriptions
      .filter((d) => d.toLowerCase().includes(lowerInput) && d.toLowerCase() !== lowerInput)
      .slice(0, 10)
  }, [descricao, despesaDescriptions, tipo])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const desc = descricao.toLowerCase()
    for (const [key, b] of Object.entries(BANCO_MAP)) {
      if (desc.includes(key)) {
        setBanco(b)
        break
      }
    }
    setIsCheckpoint(desc.includes('saldo financeiro'))

    if (tipo === 'despesa') {
      const fixedKeywords = [
        'aluguel',
        'iptu',
        'parcela',
        'sal ',
        'salario',
        'salário',
        'ferias',
        'férias',
        'vivo',
        'claro',
        'internet',
        'prolabore',
        'unimed',
      ]
      if (fixedKeywords.some((k) => desc.includes(k))) {
        setClassificacao('fixo')
      }
    }
  }, [descricao, tipo])

  const handleValorChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValorInput(formatCurrency(parseCurrency(e.target.value)))
  }

  const handleCorretorChange = (val: string) => {
    setCorretor(val)
    if (val === 'nao_informado') {
      setCorretorNivel('')
      setCorretorPorcentagem('')
    } else {
      const b = brokers.find((x) => x.id === val)
      if (b) {
        setCorretorNivel(b.level)
        setCorretorPorcentagem(b.percentage.toString())
      }
    }
  }

  const handleCaptadorChange = (val: string) => {
    setCaptador(val)
    if (val === 'nao_informado') {
      setCaptadorNivel('')
      setCaptadorPorcentagem('')
    } else {
      const b = brokers.find((x) => x.id === val)
      if (b) {
        setCaptadorNivel(b.level)
        setCaptadorPorcentagem(b.percentage.toString())
      }
    }
  }

  const executeSubmit = async () => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    addTransaction({
      tipo,
      descricao: descricao.trim(),
      valor: parseCurrency(valorInput),
      data: new Date(data).toISOString(),
      categoria: 'Outros',
      unidade,
      banco,
      isCheckpoint,
      classificacao: tipo === 'despesa' && !isCheckpoint ? classificacao : null,
      ...(tipo === 'receita' && !isCheckpoint
        ? {
            receitaTipo,
            corretor: corretor !== 'nao_informado' && corretor ? corretor : undefined,
            corretorNivel: corretor !== 'nao_informado' && corretor ? corretorNivel : undefined,
            corretorPorcentagem:
              corretor !== 'nao_informado' && corretor ? Number(corretorPorcentagem) : undefined,
            captador: captador !== 'nao_informado' && captador ? captador : undefined,
            captadorNivel: captador !== 'nao_informado' && captador ? captadorNivel : undefined,
            captadorPorcentagem:
              captador !== 'nao_informado' && captador ? Number(captadorPorcentagem) : undefined,
            notaFiscal: receitaTipo === 'comissao' ? notaFiscal : undefined,
            juridico: receitaTipo === 'comissao' ? juridico : undefined,
            juridicoValor:
              receitaTipo === 'comissao' ? parseCurrency(juridicoValorInput) : undefined,
          }
        : {}),
    })

    setDescricao('')
    setValorInput('')
    setReceitaTipo('outro')
    setCorretor('')
    setCorretorNivel('')
    setCorretorPorcentagem('')
    setCaptador('')
    setCaptadorNivel('')
    setCaptadorPorcentagem('')
    setNotaFiscal(false)
    setJuridico(false)
    setJuridicoValorInput(formatCurrency(200))

    setLoading(false)
    setConfirmDialogVisible(false)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!descricao || !valorInput) return

    if (tipo === 'despesa' && !isCheckpoint) {
      const lowerDesc = descricao.trim().toLowerCase()
      const exists = despesaDescriptions.some((d) => d.toLowerCase() === lowerDesc)
      if (!exists && despesaDescriptions.length > 0) {
        setConfirmDialogVisible(true)
        return
      }
    }

    executeSubmit()
  }

  return (
    <>
      <Card className="shadow-md border-blue-100/50">
        <CardHeader className="bg-gradient-to-r from-white to-blue-50/80 pb-4 rounded-t-lg">
          <CardTitle className="text-lg">Novo Lançamento</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setTipo('receita')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${tipo === 'receita' ? 'bg-white text-green-600 shadow-sm' : 'text-muted-foreground'}`}
              >
                Receita
              </button>
              <button
                type="button"
                onClick={() => setTipo('despesa')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${tipo === 'despesa' ? 'bg-white text-red-600 shadow-sm' : 'text-muted-foreground'}`}
              >
                Despesa
              </button>
            </div>

            {tipo === 'despesa' && !isCheckpoint && (
              <div className="flex bg-slate-50 border border-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setClassificacao('fixo')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${classificacao === 'fixo' ? 'bg-white text-indigo-600 shadow-sm' : 'text-muted-foreground'}`}
                >
                  Custo Fixo
                </button>
                <button
                  type="button"
                  onClick={() => setClassificacao('variavel')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${classificacao === 'variavel' ? 'bg-white text-amber-600 shadow-sm' : 'text-muted-foreground'}`}
                >
                  Custo Variável
                </button>
              </div>
            )}

            {tipo === 'receita' && !isCheckpoint && (
              <div className="flex bg-slate-50 border border-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setReceitaTipo('comissao')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${receitaTipo === 'comissao' ? 'bg-white text-emerald-600 shadow-sm' : 'text-muted-foreground'}`}
                >
                  Comissão
                </button>
                <button
                  type="button"
                  onClick={() => setReceitaTipo('outro')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${receitaTipo === 'outro' ? 'bg-white text-emerald-600 shadow-sm' : 'text-muted-foreground'}`}
                >
                  Outro
                </button>
              </div>
            )}

            {tipo === 'receita' && !isCheckpoint && receitaTipo === 'comissao' && (
              <div className="space-y-4 p-4 bg-emerald-50/50 rounded-lg border border-emerald-100 animate-in fade-in zoom-in-95 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <BrokerSelectField
                    label="Corretor"
                    value={corretor}
                    onChange={handleCorretorChange}
                    brokers={brokers}
                    nivel={corretorNivel}
                    onNivelChange={setCorretorNivel}
                    pct={corretorPorcentagem}
                    onPctChange={setCorretorPorcentagem}
                  />
                  <BrokerSelectField
                    label="Captador"
                    value={captador}
                    onChange={handleCaptadorChange}
                    brokers={brokers}
                    nivel={captadorNivel}
                    onNivelChange={setCaptadorNivel}
                    pct={captadorPorcentagem}
                    onPctChange={setCaptadorPorcentagem}
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
                  <div className="flex space-x-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notaFiscal"
                        checked={notaFiscal}
                        onCheckedChange={(c) => setNotaFiscal(c === true)}
                      />
                      <Label htmlFor="notaFiscal" className="text-sm font-normal cursor-pointer">
                        Nota Fiscal
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="juridico"
                        checked={juridico}
                        onCheckedChange={(c) => setJuridico(c === true)}
                      />
                      <Label htmlFor="juridico" className="text-sm font-normal cursor-pointer">
                        Jurídico
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-1/2">
                    <Label className="text-sm shrink-0">Valor Jurídico</Label>
                    <Input
                      value={juridicoValorInput}
                      onChange={(e) =>
                        setJuridicoValorInput(formatCurrency(parseCurrency(e.target.value)))
                      }
                      className="bg-white font-mono h-9"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5 relative" ref={wrapperRef}>
              <Label>Histórico / Descrição</Label>
              <Input
                required
                value={descricao}
                onChange={(e) => {
                  setDescricao(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Ex: Pagamento Fornecedor Santander"
                className="bg-white"
                autoComplete="off"
              />
              {tipo === 'despesa' && showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        setDescricao(s)
                        setShowSuggestions(false)
                      }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor</Label>
                <Input
                  required
                  value={valorInput}
                  onChange={handleValorChange}
                  placeholder="R$ 0,00"
                  className="bg-white font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input
                  type="date"
                  required
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Unidade</Label>
                <Select value={unidade} onValueChange={(v: Unidade) => setUnidade(v)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
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
              <div className="space-y-1.5">
                <Label>Banco</Label>
                <Select value={banco} onValueChange={(v: Banco) => setBanco(v)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BANCOS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="checkpoint"
                checked={isCheckpoint}
                onCheckedChange={(c) => setIsCheckpoint(c === true)}
              />
              <Label htmlFor="checkpoint" className="text-xs font-normal text-muted-foreground">
                Marcar como Saldo Financeiro
              </Label>
            </div>

            <Button type="submit" className="w-full h-11 shadow-sm mt-2" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialogVisible} onOpenChange={setConfirmDialogVisible}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padrão não encontrado</AlertDialogTitle>
            <AlertDialogDescription>
              A descrição <strong>"{descricao}"</strong> não foi encontrada no histórico de
              despesas. Deseja criar um novo padrão ou revisar a descrição inserida para evitar
              duplicidades?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Revisar</AlertDialogCancel>
            <AlertDialogAction onClick={executeSubmit}>Criar Novo Padrão</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
