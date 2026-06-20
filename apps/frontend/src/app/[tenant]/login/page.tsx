'use client'
import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { loginSchema, type LoginInput } from '@/lib/zod-schemas'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/services/api'
import { API } from '@/services/endpoints'

interface TokenResponse {
  accessToken: string
  refreshToken: string
  user: { id: string; email: string; name: string }
}

export default function LoginPage() {
  const router = useRouter()
  const params = useParams()
  const tenant = params.tenant as string
  const setAuth = useAuthStore((s) => s.setAuth)
  const [serverError, setServerError] = React.useState<string | null>(null)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: LoginInput) {
    setServerError(null)
    try {
      const { data } = await api.post<TokenResponse>(API.auth.login, values)
      setAuth(
        { id: data.user.id, name: data.user.name, email: data.user.email, role: 'organizador' },
        data.accessToken,
      )
      router.push(`/${tenant}/admin`)
    } catch {
      setServerError('E-mail ou senha incorretos.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
            <Trophy className="size-5 text-primary-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold">Copa Fácil</h1>
          <p className="text-sm text-muted-foreground">
            Acesse o painel da organização <span className="font-medium text-foreground">{tenant}</span>
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Entrar</CardTitle>
            <CardDescription className="text-xs">
              Use suas credenciais de organizador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="admin@demo.com" autoComplete="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {serverError && (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {serverError}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Demo: <span className="font-mono text-foreground">admin@demo.com</span> /{' '}
          <span className="font-mono text-foreground">Demo1234!!</span>
        </p>
      </div>
    </div>
  )
}
