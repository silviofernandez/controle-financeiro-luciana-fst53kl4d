import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ArrowRightLeft } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Checkpoint } from '@/hooks/use-audit'

export function AuditCompareTool({ checkpoints }: { checkpoints: Checkpoint[] }) {
  const [compareIdA, setCompareIdA] = useState<string>('')
  const [compareIdB, setCompareIdB] = useState<string>('')

  const diff = useMemo(() => {
    if (!compareIdA || !compareIdB) return null
    const cpA = checkpoints.find((c) => c.id === compareIdA)
    const cpB = checkpoints.find((c) => c.id === compareIdB)
    if (!cpA || !cpB) return null

    const mapA = new Map(cpA.transactions.map((t) => [t.id, t]))
    const mapB = new Map(cpB.transactions.map((t) => [t.id, t]))

    const added = []
    const removed = []
    const changed = []

    for (const t of cpB.transactions) {
      if (!mapA.has(t.id)) added.push(t)
      else {
        const oldT = mapA.get(t.id)
        if (
          oldT.amount !== t.amount ||
          oldT.description !== t.description ||
          oldT.category !== t.category ||
          oldT.date !== t.date
        ) {
          changed.push({ old: oldT, new: t })
        }
      }
    }
    for (const t of cpA.transactions) {
      if (!mapB.has(t.id)) removed.push(t)
    }

    return { added, removed, changed }
  }, [compareIdA, compareIdB, checkpoints])

  if (checkpoints.length < 2) return null

  const formatCurr = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5" /> Ferramenta de Comparação
        </CardTitle>
        <CardDescription>
          Selecione dois checkpoints para visualizar as diferenças entre eles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="space-y-2 flex-1">
            <Label>Versão Base (Antiga)</Label>
            <Select value={compareIdA} onValueChange={setCompareIdA}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {checkpoints.map((cp) => (
                  <SelectItem key={cp.id} value={cp.id}>
                    {format(parseISO(cp.timestamp), 'dd/MM/yyyy HH:mm')} - {cp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex-1">
            <Label>Versão Alvo (Nova)</Label>
            <Select value={compareIdB} onValueChange={setCompareIdB}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {checkpoints.map((cp) => (
                  <SelectItem key={cp.id} value={cp.id}>
                    {format(parseISO(cp.timestamp), 'dd/MM/yyyy HH:mm')} - {cp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {diff && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg border border-emerald-100">
                <p className="text-2xl font-bold">{diff.added.length}</p>
                <p className="text-sm">Adicionados</p>
              </div>
              <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100">
                <p className="text-2xl font-bold">{diff.removed.length}</p>
                <p className="text-sm">Removidos</p>
              </div>
              <div className="bg-amber-50 text-amber-700 p-4 rounded-lg border border-amber-100">
                <p className="text-2xl font-bold">{diff.changed.length}</p>
                <p className="text-sm">Alterados</p>
              </div>
            </div>

            {diff.added.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-emerald-700">Adicionados</h3>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableBody>
                      {diff.added.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>
                            {t.date ? format(parseISO(t.date), 'dd/MM/yyyy') : ''}
                          </TableCell>
                          <TableCell>{t.description}</TableCell>
                          <TableCell className="text-emerald-600 font-medium">
                            {formatCurr(t.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {diff.removed.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-red-700">Removidos</h3>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableBody>
                      {diff.removed.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>
                            {t.date ? format(parseISO(t.date), 'dd/MM/yyyy') : ''}
                          </TableCell>
                          <TableCell className="line-through text-slate-500">
                            {t.description}
                          </TableCell>
                          <TableCell className="text-red-600 font-medium">
                            {formatCurr(t.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {diff.changed.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-amber-700">Alterados</h3>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableBody>
                      {diff.changed.map((t) => (
                        <TableRow key={t.new.id}>
                          <TableCell>
                            {t.new.date ? format(parseISO(t.new.date), 'dd/MM/yyyy') : ''}
                          </TableCell>
                          <TableCell>
                            <span className="text-slate-500 line-through mr-2">
                              {t.old.description}
                            </span>
                            <span>{t.new.description}</span>
                          </TableCell>
                          <TableCell className="text-amber-600 font-medium text-right">
                            <span className="text-slate-500 line-through mr-2 font-normal text-sm">
                              {formatCurr(t.old.amount)}
                            </span>
                            {formatCurr(t.new.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
