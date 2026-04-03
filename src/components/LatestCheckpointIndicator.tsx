import { useAudit } from '@/hooks/use-audit'
import { History } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function LatestCheckpointIndicator() {
  const { checkpoints } = useAudit()
  const latest = checkpoints[0]

  if (!latest) return null

  return (
    <div className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-sm w-fit animate-fade-in">
      <History className="w-4 h-4 text-primary" />
      <span>
        Último checkpoint:{' '}
        <strong className="font-medium">
          {format(parseISO(latest.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </strong>{' '}
        — {latest.name}
      </span>
    </div>
  )
}
