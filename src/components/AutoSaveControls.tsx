import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Save, Trash2, Check, Loader2 } from 'lucide-react'
import { useAutoSave } from '@/contexts/AutoSaveContext'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function AutoSaveControls() {
  const { status, lastSavedAt, triggerSave, clearAll } = useAutoSave()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [doubleConfirmOpen, setDoubleConfirmOpen] = useState(false)

  const handleManualSave = () => {
    triggerSave()
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white/90 backdrop-blur-md p-3 rounded-full border border-slate-200 shadow-xl animate-fade-in-up">
      <div className="flex flex-col mr-1">
        <span className="text-[11px] font-medium min-w-[160px] text-right">
          {status === 'saving' ? (
            <span className="flex items-center justify-end gap-1.5 text-blue-600">
              <Loader2 className="w-3 h-3 animate-spin" /> Salvando...
            </span>
          ) : status === 'saved' && lastSavedAt ? (
            <span className="flex items-center justify-end gap-1.5 text-emerald-600">
              <Check className="w-3 h-3" /> Salvo automaticamente às {format(lastSavedAt, 'HH:mm')}
            </span>
          ) : (
            <span className="text-slate-400">Aguardando edições...</span>
          )}
        </span>
      </div>

      <div className="w-px h-6 bg-slate-200" />

      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualSave}
          className="h-8 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 gap-1.5 px-3"
        >
          <Save className="w-3 h-3" /> Salvar Manualmente
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          className="h-8 rounded-full text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5 px-3"
        >
          <Trash2 className="w-3 h-3" /> Limpar Tudo
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso iniciará o processo de exclusão de todo o progresso não salvo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => {
                setConfirmOpen(false)
                setTimeout(() => setDoubleConfirmOpen(true), 200)
              }}
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={doubleConfirmOpen} onOpenChange={setDoubleConfirmOpen}>
        <AlertDialogContent className="border-red-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Confirmação Final</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá todo o progresso em formulários, textos colados e triagem da sua
              sessão atual. Esta ação não pode ser desfeita. Deseja prosseguir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                setDoubleConfirmOpen(false)
                clearAll()
              }}
            >
              Sim, Limpar Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
