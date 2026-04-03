import { useState } from 'react'
import { useDetails } from '@/contexts/DetailsContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Trash2, Edit2, Loader2, Save, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
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

export function DetailsSettings() {
  const { details, removeDetail, renameDetail, loading } = useDetails()
  const [searchTerm, setSearchTerm] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [detailToDelete, setDetailToDelete] = useState<{
    id: string
    name: string
    count: number
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [renameConfirmOpen, setRenameConfirmOpen] = useState(false)
  const [renameData, setRenameData] = useState<{
    id: string
    oldName: string
    newName: string
    count: number
  } | null>(null)
  const [isRenaming, setIsRenaming] = useState(false)

  const filteredDetails = details.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeleteClick = async (id: string, name: string) => {
    try {
      const res = await pb
        .collection('transactions')
        .getList(1, 1, { filter: `description = "${name.replace(/"/g, '\\"')}"` })
      setDetailToDelete({ id, name, count: res.totalItems })
      setDeleteConfirmOpen(true)
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Falha ao verificar uso do detalhe.',
        variant: 'destructive',
      })
    }
  }

  const confirmDelete = async () => {
    if (!detailToDelete) return
    setIsDeleting(true)
    try {
      await removeDetail(detailToDelete.id)
      toast({ title: 'Sucesso', description: 'Detalhe removido.' })
      setDeleteConfirmOpen(false)
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao remover.', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
      setDetailToDelete(null)
    }
  }

  const handleSaveEdit = async (id: string, oldName: string) => {
    if (!editName.trim() || editName === oldName) {
      setEditingId(null)
      return
    }

    try {
      const res = await pb
        .collection('transactions')
        .getList(1, 1, { filter: `description = "${oldName.replace(/"/g, '\\"')}"` })
      if (res.totalItems > 0) {
        setRenameData({ id, oldName, newName: editName.trim(), count: res.totalItems })
        setRenameConfirmOpen(true)
      } else {
        await renameDetail(id, editName.trim(), false)
        toast({ title: 'Sucesso', description: 'Detalhe renomeado.' })
        setEditingId(null)
      }
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao renomear.', variant: 'destructive' })
    }
  }

  const confirmRename = async (updateAll: boolean) => {
    if (!renameData) return
    setIsRenaming(true)
    try {
      await renameDetail(renameData.id, renameData.newName, updateAll)
      toast({ title: 'Sucesso', description: 'Detalhe renomeado com sucesso.' })
      setRenameConfirmOpen(false)
      setEditingId(null)
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao renomear.', variant: 'destructive' })
    } finally {
      setIsRenaming(false)
      setRenameData(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão de Detalhes</CardTitle>
        <CardDescription>
          Gerencie os nomes dos detalhes (histórico/descrição) usados nos lançamentos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Buscar detalhe..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />

        <div className="border rounded-md max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white shadow-sm">
              <TableRow>
                <TableHead>Nome do Detalhe</TableHead>
                <TableHead className="w-[150px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredDetails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                    Nenhum detalhe encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDetails.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      {editingId === d.id ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(d.id, d.name)}
                          autoFocus
                          className="h-8"
                        />
                      ) : (
                        <span className="font-medium">{d.name}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      {editingId === d.id ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSaveEdit(d.id, d.name)}
                            className="text-emerald-600 h-8 w-8"
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingId(null)}
                            className="text-muted-foreground h-8 w-8"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingId(d.id)
                              setEditName(d.name)
                            }}
                            className="text-blue-600 h-8 w-8"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(d.id, d.name)}
                            className="text-destructive h-8 w-8 hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Detalhe</AlertDialogTitle>
            <AlertDialogDescription>
              Este detalhe é usado em <strong>{detailToDelete?.count || 0}</strong> lançamentos. Tem
              certeza que deseja excluir? Os lançamentos existentes não serão apagados, apenas a
              sugestão de autocomplete será removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={renameConfirmOpen} onOpenChange={setRenameConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renomear Detalhe</AlertDialogTitle>
            <AlertDialogDescription>
              Existem <strong>{renameData?.count || 0}</strong> lançamentos com este detalhe ("
              {renameData?.oldName}"). Deseja atualizar todos para o novo nome ("
              {renameData?.newName}")?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0">Cancelar</AlertDialogCancel>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => confirmRename(false)} disabled={isRenaming}>
                Não, Alterar Apenas Este
              </Button>
              <Button onClick={() => confirmRename(true)} disabled={isRenaming}>
                {isRenaming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Sim,
                Atualizar Todos
              </Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
