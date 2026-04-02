import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Landmark, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({ title: 'Erro', description: 'Preencha todos os campos', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (error: any) {
      let description = 'Ocorreu um erro inesperado.'

      if (
        error?.status === 400 ||
        error?.message === 'Failed to authenticate.' ||
        error?.response?.message === 'Failed to authenticate.'
      ) {
        description = 'E-mail ou senha incorretos.'
      } else if (error?.message) {
        description = error.message
      }

      toast({
        title: 'Falha na Autenticação',
        description,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-4">
      <Card className="w-full max-w-md shadow-lg border-blue-100/50 animate-fade-in-up">
        <CardHeader className="space-y-3 pb-6 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 bg-primary/10 flex items-center justify-center rounded-xl">
              <Landmark className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">
            Acessar Sistema
          </CardTitle>
          <CardDescription className="text-slate-500">
            Insira suas credenciais para gerenciar suas finanças.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link
                  to="/recovery"
                  className="text-xs font-medium text-primary hover:underline"
                  tabIndex={-1}
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Entrar
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-slate-600">
            Ainda não tem uma conta?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Registre-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
