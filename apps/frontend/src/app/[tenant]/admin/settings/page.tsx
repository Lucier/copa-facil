import { Settings, Building2, Bell, Shield, Construction } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gerencie as configurações da sua organização.</p>
      </div>

      {/* Not implemented banner */}
      <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
        <Construction className="size-4 shrink-0" />
        <span>Esta página ainda não está conectada ao backend. As alterações não serão salvas.</span>
      </div>

      {/* Org Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Informações da Organização</CardTitle>
          </div>
          <CardDescription>Dados da sua organização visíveis no portal público.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="org-name">Nome da Organização</Label>
              <Input id="org-name" placeholder="Nome da organização" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-slug">Slug (URL)</Label>
              <div className="flex">
                <span className="flex items-center rounded-l-md border border-r-0 border-border bg-secondary px-3 text-xs text-muted-foreground">
                  copafacil.com.br/
                </span>
                <Input id="org-slug" placeholder="meu-torneio" className="rounded-l-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-email">Email de Contato</Label>
              <Input id="org-email" type="email" placeholder="contato@minhaorg.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-phone">Telefone</Label>
              <Input id="org-phone" placeholder="(00) 00000-0000" />
            </div>
          </div>
          <Separator />
          <div className="flex justify-end">
            <Button size="sm" disabled>Salvar Alterações</Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Notificações</CardTitle>
          </div>
          <CardDescription>Controle quais eventos geram notificações para a equipe.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'Nova inscrição de time', description: 'Notificar quando um time solicitar inscrição', enabled: true },
            { label: 'Pagamento confirmado', description: 'Notificar ao confirmar um pagamento via gateway', enabled: true },
            { label: 'Documentos para revisão', description: 'Notificar ao receber novos documentos', enabled: true },
            { label: 'Partida encerrada', description: 'Notificar ao finalizar uma partida', enabled: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <Badge variant={item.enabled ? 'success' : 'outline'}>
                {item.enabled ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Segurança</CardTitle>
          </div>
          <CardDescription>Configurações de acesso e autenticação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input id="current-password" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input id="new-password" type="password" placeholder="••••••••" />
            </div>
          </div>
          <Separator />
          <div className="flex justify-end">
            <Button size="sm" variant="outline">Alterar Senha</Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="size-4 text-destructive" />
            <CardTitle className="text-base text-destructive">Zona de Risco</CardTitle>
          </div>
          <CardDescription>Ações irreversíveis que afetam toda a organização.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <div>
              <p className="text-sm font-medium">Excluir Organização</p>
              <p className="text-xs text-muted-foreground">Remove permanentemente todos os dados. Esta ação não pode ser desfeita.</p>
            </div>
            <Button variant="destructive" size="sm">Excluir</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
