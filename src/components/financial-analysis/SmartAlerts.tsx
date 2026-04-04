import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, TrendingDown } from 'lucide-react'
import { generateAlerts } from '@/lib/financial-metrics'
import { Transaction } from '@/hooks/use-financial-data'

export function SmartAlerts({ transactions }: { transactions: Transaction[] }) {
  const alerts = generateAlerts(transactions)

  if (alerts.length === 0) return null

  return (
    <div className="space-y-3">
      {alerts.map((alert, i) => (
        <Alert
          key={i}
          variant={alert.type === 'destructive' ? 'destructive' : 'default'}
          className={alert.type === 'warning' ? 'border-amber-500 text-amber-600' : ''}
        >
          {alert.type === 'warning' ? (
            <TrendingDown className="h-4 w-4 stroke-amber-500" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
