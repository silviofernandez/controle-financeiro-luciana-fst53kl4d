import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFinancialData } from '@/hooks/use-financial-data'
import { SmartAlerts } from '@/components/financial-analysis/SmartAlerts'
import { MonthlyAnalysis } from '@/components/financial-analysis/MonthlyAnalysis'
import { QuarterlyAnalysis } from '@/components/financial-analysis/QuarterlyAnalysis'
import { SemiAnnualAnalysis } from '@/components/financial-analysis/SemiAnnualAnalysis'
import { AnnualAnalysis } from '@/components/financial-analysis/AnnualAnalysis'
import { AssistantChat } from '@/components/financial-analysis/AssistantChat'
import { Loader2 } from 'lucide-react'

export default function FinancialAnalysis() {
  const { transactions, loading } = useFinancialData()

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
        <p>Analisando dados financeiros estrategicamente...</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto animate-fade-in-up">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Análise Financeira</h1>
        <p className="text-slate-500">Insights executivos e visão estratégica do seu negócio.</p>
      </div>

      <SmartAlerts transactions={transactions} />

      <Tabs defaultValue="monthly" className="space-y-6">
        <TabsList className="bg-slate-100/80 p-1 w-full md:w-auto overflow-x-auto flex-nowrap justify-start">
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
          <TabsTrigger value="quarterly">Trimestral</TabsTrigger>
          <TabsTrigger value="semiannual">Semestral</TabsTrigger>
          <TabsTrigger value="annual">Anual</TabsTrigger>
          <TabsTrigger value="chat" className="text-primary font-medium">
            Assistente CFO
          </TabsTrigger>
        </TabsList>

        <div className="min-h-[500px]">
          <TabsContent value="monthly">
            <MonthlyAnalysis transactions={transactions} />
          </TabsContent>
          <TabsContent value="quarterly">
            <QuarterlyAnalysis transactions={transactions} />
          </TabsContent>
          <TabsContent value="semiannual">
            <SemiAnnualAnalysis transactions={transactions} />
          </TabsContent>
          <TabsContent value="annual">
            <AnnualAnalysis transactions={transactions} />
          </TabsContent>
          <TabsContent value="chat">
            <AssistantChat transactions={transactions} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
