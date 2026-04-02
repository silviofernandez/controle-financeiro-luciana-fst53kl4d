import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Landmark, Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    if (!email || !password || !confirmPassword) {
      toast({ title: 'Erro', description: 'Preencha todos os campos.', variant: 'destructive' })
      return
    }

    if (password !== confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      await signUp(email, password)
      toast({ title: 'Sucesso!', description: 'Conta criada com sucesso.' })
      navigate('/')
    } catch (error: any) {
      let currentFieldErrors = extractFieldErrors(error)

      if (error && typeof error === 'object' && 'response' in error) {
        const pbError = error as any
        if (pbError.response?.data?.email?.code === 'validation_not_unique') {
          currentFieldErrors = { ...currentFieldErrors, email: 'Este e-mail já está em uso.' }
        }
      }

      setFieldErrors(currentFieldErrors)

      if (Object.keys(currentFieldErrors).length > 0) {
        toast({
          title: 'Dados inválidos',
          description: 'Verifique os campos destacados no formulário.',
          variant: 'destructive',
        })
        return
      }

      let description = 'Ocorreu um erro ao criar a conta.'
      if (error.message) {
        description =
          error.message === 'Failed to create record.'
            ? 'Não foi possível criar o registro. Verifique os dados informados e tente novamente.'
            : error.message
      }

      toast({
        title: 'Falha no Registro',
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
            Criar Conta
          </CardTitle>
          <CardDescription className="text-slate-500">
            Registre-se para começar a gerenciar suas finanças.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className={fieldErrors.email ? 'text-red-500' : ''}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }))
                }}
                required
                className={`bg-white ${fieldErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {fieldErrors.email && (
                <p className="text-sm font-medium text-red-500 animate-fade-in">
                  {fieldErrors.email}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className={fieldErrors.password ? 'text-red-500' : ''}>
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }))
                  }}
                  required
                  className={`bg-white pr-10 ${fieldErrors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
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
              {fieldErrors.password && (
                <p className="text-sm font-medium text-red-500 animate-fade-in">
                  {fieldErrors.password}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11 mt-2" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Registrar
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-slate-600">
            Já possui uma conta?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Entrar
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
