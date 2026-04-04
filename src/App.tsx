import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Commissions from './pages/Commissions'
import ContributionMargin from './pages/ContributionMargin'
import OperatingCosts from './pages/OperatingCosts'
import CompanyResult from './pages/CompanyResult'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import InsertData from './pages/InsertData'
import Audit from './pages/Audit'
import Imports from './pages/Imports'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Recovery from './pages/auth/Recovery'

import { TransactionProvider } from './contexts/TransactionContext'
import { CommissionProvider } from './contexts/CommissionContext'
import { BrokerProvider } from './contexts/BrokerContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DetailsProvider } from './contexts/DetailsContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { BudgetProvider } from './contexts/BudgetContext'
import { CreditCardProvider } from './contexts/CreditCardContext'
import { AutoSaveProvider } from './contexts/AutoSaveContext'
import { Loader2 } from 'lucide-react'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/recovery', element: <Recovery /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Index /> },
      { path: 'inserir', element: <InsertData /> },
      { path: 'resultado-empresa', element: <CompanyResult /> },
      { path: 'relatorios', element: <Reports /> },
      { path: 'margem-contribuicao', element: <ContributionMargin /> },
      { path: 'custos-operacionais', element: <OperatingCosts /> },
      { path: 'comissoes', element: <Commissions /> },
      { path: 'importacoes', element: <Imports /> },
      { path: 'auditoria', element: <Audit /> },
      { path: 'configuracoes', element: <Settings /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])

const App = () => (
  <AuthProvider>
    <DetailsProvider>
      <SettingsProvider>
        <CreditCardProvider>
          <TransactionProvider>
            <CommissionProvider>
              <BrokerProvider>
                <BudgetProvider>
                  <AutoSaveProvider>
                    <TooltipProvider>
                      <Toaster />
                      <Sonner />
                      <RouterProvider router={router} />
                    </TooltipProvider>
                  </AutoSaveProvider>
                </BudgetProvider>
              </BrokerProvider>
            </CommissionProvider>
          </TransactionProvider>
        </CreditCardProvider>
      </SettingsProvider>
    </DetailsProvider>
  </AuthProvider>
)

export default App
