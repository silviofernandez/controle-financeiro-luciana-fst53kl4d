import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import { Save } from 'lucide-react'
import { CommissionSettings } from '@/components/CommissionSettings'
import { BrokerSettings } from '@/components/BrokerSettings'
import { TeamCommissionManager } from '@/components/TeamCommissionManager'

export default function Settings() {
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    toast({ title: 'Sucesso!', description: 'Configurações salvas e aplicadas com sucesso.' })
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
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 max-w-4xl mb-6 h-auto sm:h-10">
          <TabsTrigger value="geral" className="py-2 sm:py-1.5 text-xs sm:text-sm">
            Geral & Integrações
          </TabsTrigger>
          <TabsTrigger value="equipes" className="py-2 sm:py-1.5 text-xs sm:text-sm">
            Gerenciar Equipes de Comissão
          </TabsTrigger>
          <TabsTrigger value="comissoes" className="py-2 sm:py-1.5 text-xs sm:text-sm">
            Regras de Comissão
          </TabsTrigger>
          <TabsTrigger value="corretores" className="py-2 sm:py-1.5 text-xs sm:text-sm">
            Corretores / Colaboradores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="shadow-md border-blue-100/50">
              <CardHeader className="bg-gradient-to-r from-white to-blue-50/30 pb-4">
                <CardTitle>Perfil</CardTitle>
                <CardDescription>Informações da conta de usuário.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="space-y-2">
                  <Label>Nome de Exibição</Label>
                  <Input defaultValue="Luciana" className="max-w-md bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>Email Principal</Label>
                  <Input
                    type="email"
                    defaultValue="luciana@example.com"
                    disabled
                    className="max-w-md"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    O e-mail não pode ser alterado por aqui.
                  </p>
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
