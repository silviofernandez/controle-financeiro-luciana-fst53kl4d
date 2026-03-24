import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface MissingNameInfo {
  original: string
  edited: string
}

interface UnregisteredBrokersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unregisteredNames: string[]
  onConfirm: (names: MissingNameInfo[]) => void
}

export function UnregisteredBrokersModal({
  open,
  onOpenChange,
  unregisteredNames,
  onConfirm,
}: UnregisteredBrokersModalProps) {
  const [names, setNames] = useState<MissingNameInfo[]>([])

  useEffect(() => {
    if (open && Array.isArray(unregisteredNames)) {
      setNames(
        unregisteredNames
          .filter((n) => typeof n === 'string')
          .map((n) => ({ original: n, edited: n })),
      )
    }
  }, [open, unregisteredNames])

  const handleNameChange = (index: number, val: string) => {
    const updated = [...names]
    if (updated[index]) {
      updated[index].edited = typeof val === 'string' ? val : ''
    }
    setNames(updated)
  }

  const handleConfirm = () => {
    const validNames = names.filter((n) => {
      return n && typeof n.edited === 'string' && n.edited.trim() !== ''
    })
    onConfirm(validNames)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Participantes Não Cadastrados</DialogTitle>
          <DialogDescription>
            Os seguintes participantes não foram encontrados no sistema. Edite os nomes se
            necessário e cadastre-os em lote para continuar o lançamento.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          {names.map((item, index) => (
            <div key={index} className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Nome Encontrado: {item.original}
              </Label>
              <Input
                value={item.edited}
                onChange={(e) => handleNameChange(index, e?.target?.value || '')}
                placeholder="Nome completo do participante"
              />
            </div>
          ))}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Cadastrar Agora</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
