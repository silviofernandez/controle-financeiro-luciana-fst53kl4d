import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/supabase/errors'

export default function Recovery() {
  const { recoverPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await recoverPassword(email)
      toast({ title: 'Sucesso', description: 'Email de recuperação enviado!' })
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: getErrorMessage(err) || 'Erro ao enviar email',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-background p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Recuperar Senha</h1>
          <p className="text-muted-foreground">Informe seu email para receber o link</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Enviando...' : 'Enviar link'}
          </Button>
        </form>
        <div className="text-center text-sm">
          Lembrou a senha?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  )
}
