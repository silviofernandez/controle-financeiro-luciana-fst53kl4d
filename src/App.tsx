import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Commissions from './pages/Commissions'
import ContributionMargin from './pages/ContributionMargin'
import OperatingCosts from './pages/OperatingCosts'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import { TransactionProvider } from './contexts/TransactionContext'
import { CommissionProvider } from './contexts/CommissionContext'
import { BrokerProvider } from './contexts/BrokerContext'

const App = () => (
  <TransactionProvider>
    <CommissionProvider>
      <BrokerProvider>
        <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/relatorios" element={<Reports />} />
                <Route path="/margem-contribuicao" element={<ContributionMargin />} />
                <Route path="/custos-operacionais" element={<OperatingCosts />} />
                <Route path="/comissoes" element={<Commissions />} />
                <Route path="/configuracoes" element={<Settings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </BrowserRouter>
      </BrokerProvider>
    </CommissionProvider>
  </TransactionProvider>
)

export default App
