import React, { useState, useEffect } from 'react'
import { useTransactions } from '@/contexts/TransactionContext'
import { UNIDADES, BANCOS, Unidade, Banco } from '@/types'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { formatCurrency, parseCurrency } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const BANCO_MAP: Record<string, Banco> = {
  santander: 'Santander',
  inter: 'Inter',
  btg: 'BTG',
  caixa: 'Caixa',
  nubank: 'Nubank',
  nu: 'Nubank',
  'd financeiro': 'D Financeiro',
  dfinanceiro: 'D Financeiro',
}

export function TransactionForm() {
  const { addTransaction } = useTransactions()
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('despesa')
  const [descricao, setDescricao] = useState('')
  const [valorInput, setValorInput] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [unidade, setUnidade] = useState<Unidade>('Geral')
  const [banco, setBanco] = useState<Banco>('Outros')
  const [isCheckpoint, setIsCheckpoint] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const desc = descricao.toLowerCase()
    for (const [key, b] of Object.entries(BANCO_MAP)) {
      if (desc.includes(key)) {
        setBanco(b)
        break
      }
    }
    setIsCheckpoint(desc.includes('saldo financeiro'))
  }, [descricao])

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValorInput(formatCurrency(parseCurrency(e.target.value)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!descricao || !valorInput) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    addTransaction({
      tipo,
      descricao,
      valor: parseCurrency(valorInput),
      data: new Date(data).toISOString(),
      categoria: 'Outros', // Default category since it's less relevant now
      unidade,
      banco,
      isCheckpoint,
    })
    setDescricao('')
    setValorInput('')
    setLoading(false)
  }

  return (
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

          <div className="space-y-1.5">
            <Label>Histórico / Descrição</Label>
            <Input
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Pagamento Fornecedor Santander"
              className="bg-white"
            />
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
  )
}
