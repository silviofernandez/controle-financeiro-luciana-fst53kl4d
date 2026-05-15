import { Calendar } from '@/components/ui/calendar'
import { Bill } from '@/types/bills'
import { useMemo } from 'react'
import { parseISO, startOfDay } from 'date-fns'
import { computeBillStatus } from '@/hooks/use-bills'

interface Props {
  bills: Bill[]
  selectedDate: Date | undefined
  onSelectDate: (date: Date | undefined) => void
}

export function BillsCalendar({ bills, selectedDate, onSelectDate }: Props) {
  const modifiers = useMemo(() => {
    const overdue: Date[] = []
    const dueToday: Date[] = []
    const paidOrScheduled: Date[] = []

    bills.forEach((b) => {
      const date = startOfDay(parseISO(b.vencimento))
      const status = computeBillStatus(b)
      if (status === 'Vencido') overdue.push(date)
      else if (status === 'Vence Hoje') dueToday.push(date)
      else paidOrScheduled.push(date)
    })
    return { overdue, dueToday, paidOrScheduled }
  }, [bills])

  const modifiersStyles = {
    overdue: { backgroundColor: '#ef4444', color: 'white' },
    dueToday: { backgroundColor: '#eab308', color: 'white' },
    paidOrScheduled: { backgroundColor: '#22c55e', color: 'white' },
  }

  return (
    <div className="p-4 border rounded-xl bg-card shadow-sm flex justify-center">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelectDate}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        className="rounded-md"
      />
    </div>
  )
}
