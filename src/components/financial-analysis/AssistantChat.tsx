import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Bot, User } from 'lucide-react'
import { Transaction } from '@/hooks/use-financial-data'

type Message = { role: 'user' | 'assistant'; content: string }

export function AssistantChat({ transactions }: { transactions: Transaction[] }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Olá! Sou o seu CFO Virtual. Como posso ajudar com a análise financeira estratégica dos seus dados hoje?',
    },
  ])
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const generateResponse = (query: string): string => {
    const q = query.toLowerCase()
    if (q.includes('margem') && (q.includes('caiu') || q.includes('queda'))) {
      return 'Analisando os dados recentes, uma queda de margem geralmente está associada ao aumento de Despesas Variáveis proporcionais à receita. Recomendo verificar a aba "Mensal" para auditar as Top 5 Despesas deste mês em relação ao anterior.'
    }
    if (
      q.includes('unidade') &&
      (q.includes('cara') || q.includes('custo') || q.includes('eficiência'))
    ) {
      return 'Com base no histórico anual, você pode visualizar o "Ranking de Eficiência por Unidade" na aba Anual. Unidades com menor eficiência % são as que possuem maior peso de custo em relação à receita que geram, demandando planos de ação imediatos.'
    }
    if (q.includes('ponto de equilíbrio') || q.includes('break-even')) {
      return 'O ponto de equilíbrio é alcançado quando a sua Margem de Contribuição (Receita - Despesas Variáveis) empata perfeitamente com as Despesas Fixas. Na aba Semestral, mostramos o comportamento dos custos fixos (o alvo do seu break-even) ao longo do tempo.'
    }
    return 'Excelente observação. Como CFO, recomendo sempre avaliarmos o impacto disso no fluxo de caixa livre e na margem de contribuição geral. Considere auditar os relatórios anuais e trimestrais para uma visão mais holística e assertiva.'
  }

  const handleSend = () => {
    if (!input.trim()) return
    const newMsg: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, newMsg])
    setInput('')

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: generateResponse(newMsg.content) },
      ])
    }, 800)
  }

  return (
    <Card className="h-[600px] flex flex-col shadow-sm">
      <CardHeader className="bg-slate-50 border-b pb-4">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Bot className="h-5 w-5" /> Assistente CFO AI
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 px-4">
        <ScrollArea className="h-full pr-4" ref={scrollRef}>
          <div className="space-y-4 py-6">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-lg max-w-[80%] text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-white border text-slate-700'}`}
                >
                  {m.content}
                </div>
                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-slate-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-4 border-t bg-slate-50">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex w-full gap-2"
        >
          <Input
            placeholder="Pergunte sobre margens, custos, unidades..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="bg-white"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
