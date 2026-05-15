import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Download, FileSpreadsheet, Mail } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { toast } from 'sonner'

interface Props {
  month: string
  setMonth: (m: string) => void
  year: string
  setYear: (y: string) => void
  isYTD: boolean
  setIsYTD: (v: boolean) => void
  compare: string
  setCompare: (v: string) => void
  onExportExcel: () => void
  onExportPDF: () => void
}

export function DREHeader({
  month,
  setMonth,
  year,
  setYear,
  isYTD,
  setIsYTD,
  compare,
  setCompare,
  onExportExcel,
  onExportPDF,
}: Props) {
  const [email, setEmail] = useState('')
  const [open, setOpen] = useState(false)

  const handleEmail = () => {
    if (!email) return
    toast.success(`DRE enviado com sucesso para ${email}`)
    setOpen(false)
    setEmail('')
  }

  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
  const years = ['2023', '2024', '2025', '2026', '2027']

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 print:hidden bg-white p-4 rounded-lg shadow-sm border border-slate-100">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  Mês {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 border-l pl-4">
          <Switch id="ytd" checked={isYTD} onCheckedChange={setIsYTD} />
          <Label htmlFor="ytd" className="cursor-pointer">
            Acumulado Ano (YTD)
          </Label>
        </div>

        <div className="flex items-center space-x-2 border-l pl-4">
          <Label>Comparar:</Label>
          <Select value={compare} onValueChange={setCompare}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem comparação</SelectItem>
              <SelectItem value="prev_month">Mês anterior</SelectItem>
              <SelectItem value="prev_year">Mesmo mês ano anterior</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={onExportExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
        </Button>
        <Button variant="outline" size="sm" onClick={onExportPDF}>
          <Download className="w-4 h-4 mr-2" /> PDF
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary">
              <Mail className="w-4 h-4 mr-2" /> Enviar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar DRE por E-mail</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label>E-mail do destinatário</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="diretoria@exemplo.com"
                className="mt-2"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleEmail}>Enviar Relatório</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
