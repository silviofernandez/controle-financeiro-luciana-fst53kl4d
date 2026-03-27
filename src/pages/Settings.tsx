import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import { Save, LogOut } from 'lucide-react'
import { CommissionSettings } from '@/components/CommissionSettings'
import { BrokerSettings } from '@/components/BrokerSettings'
import { TeamCommissionManager } from '@/components/TeamCommissionManager'
import { DataImporter } from '@/components/DataImporter'
import { useAuth } from '@/contexts/AuthContext'

export default function Settings() {
  const { user, signOut } = useAuth()

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    toast({ title: 'Sucesso!', description: 'Configurações salvas e aplicadas com sucesso.' })
  }

  const handleSignOut = () => {
    signOut()
    toast({ title: 'Desconectado', description: 'Você saiu da sua conta.' })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary">Configurações</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie suas preferências, integrações e regras de negócio.
        </p>
      </div>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="flex flex-wrap w-full mb-6 h-auto sm:h-10 max-w-5xl bg-muted p-1 rounded-md">
          <TabsTrigger
            value="geral"
            className="flex-1 py-2 sm:py-1.5 text-xs sm:text-sm whitespace-nowrap"
          >
            Geral & Integrações
          </TabsTrigger>
          <TabsTrigger
            value="importacao"
            className="flex-1 py-2 sm:py-1.5 text-xs sm:text-sm whitespace-nowrap"
          >
            Importar Dados
          </TabsTrigger>
          <TabsTrigger
            value="equipes"
            className="flex-1 py-2 sm:py-1.5 text-xs sm:text-sm whitespace-nowrap"
          >
            Equipes
          </TabsTrigger>
          <TabsTrigger
            value="comissoes"
            className="flex-1 py-2 sm:py-1.5 text-xs sm:text-sm whitespace-nowrap"
          >
            Regras
          </TabsTrigger>
          <TabsTrigger
            value="corretores"
            className="flex-1 py-2 sm:py-1.5 text-xs sm:text-sm whitespace-nowrap"
          >
            Corretores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="importacao">
          <DataImporter />
        </TabsContent>

        <TabsContent value="geral">
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="shadow-md border-blue-100/50">
              <CardHeader className="bg-gradient-to-r from-white to-blue-50/30 pb-4">
                <CardTitle>Perfil</CardTitle>
                <CardDescription>Informações da conta de usuário e sessão.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="space-y-2">
                  <Label>Nome de Exibição</Label>
                  <Input defaultValue="Admin" className="max-w-md bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>Email Principal</Label>
                  <Input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="max-w-md bg-slate-50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    O e-mail vinculado à sua conta Supabase Auth.
                  </p>
                </div>

                <div className="pt-4 border-t border-border/60">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleSignOut}
                    className="gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair da Conta
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-blue-100/50">
              <CardHeader className="bg-gradient-to-r from-white to-blue-50/30 pb-4">
                <CardTitle>Integrações Externas</CardTitle>
                <CardDescription>
                  Conecte seu banco de dados Supabase e Planilha do Google.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="space-y-2">
                  <Label>Supabase URL</Label>
                  <Input type="url" placeholder="https://xyz.supabase.co" className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>Supabase Anon Key</Label>
                  <Input type="password" placeholder="ey..." className="bg-white" />
                </div>
                <div className="space-y-3 pt-4 mt-2 border-t border-border/50">
                  <Label>Google Sheets Document ID</Label>
                  <Input placeholder="1BxiMVs0XRYFgwnm..." className="bg-white" />
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Você pode encontrar este ID na URL da sua planilha, entre <code>/d/</code> e{' '}
                    <code>/edit</code>.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-4 pb-10">
              <Button
                type="submit"
                size="lg"
                className="shadow-md hover:shadow-lg transition-all px-8 h-12 gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar Configurações
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="equipes">
          <TeamCommissionManager />
        </TabsContent>

        <TabsContent value="comissoes">
          <CommissionSettings />
        </TabsContent>

        <TabsContent value="corretores">
          <BrokerSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
