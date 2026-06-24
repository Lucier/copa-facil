'use client'
import * as React from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Trophy, UserPlus, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form'
import api from '@/services/api'

interface TeamInfo {
  id: string
  name: string
  acronym: string | null
  city: string | null
  nickname: string | null
  primaryColor: string | null
}

const joinSchema = z.object({
  fullName: z.string().min(3, 'Informe o nome completo'),
  birthdate: z.string().optional(),
  document: z.string().optional(),
  jerseyNumber: z.coerce.number().int().min(1).optional().or(z.literal('')),
  mainPosition: z.string().optional(),
})

type JoinInput = z.infer<typeof joinSchema>

export default function JoinTeamPage() {
  const params = useParams()
  const token = params.token as string
  const tenant = params.tenant as string

  const [team, setTeam] = React.useState<TeamInfo | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [notFound, setNotFound] = React.useState(false)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [serverError, setServerError] = React.useState<string | null>(null)

  React.useEffect(() => {
    api
      .get<TeamInfo>(`/teams/join/${token}`, { headers: { 'x-tenant-id': tenant } })
      .then((res) => setTeam(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [token, tenant])

  const form = useForm<JoinInput>({
    resolver: zodResolver(joinSchema),
    defaultValues: { fullName: '', birthdate: '', document: '', jerseyNumber: '', mainPosition: '' },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: JoinInput) {
    setServerError(null)
    try {
      const payload = {
        fullName: values.fullName,
        ...(values.birthdate ? { birthdate: values.birthdate } : {}),
        ...(values.document ? { document: values.document } : {}),
        ...(values.jerseyNumber ? { jerseyNumber: Number(values.jerseyNumber) } : {}),
        ...(values.mainPosition ? { mainPosition: values.mainPosition } : {}),
      }
      const { data } = await api.post<{ message: string }>(`/teams/join/${token}`, payload, {
        headers: { 'x-tenant-id': tenant },
      })
      setSuccess(data.message)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao realizar cadastro. Tente novamente.'
      setServerError(Array.isArray(msg) ? msg.join(', ') : msg)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <Trophy className="mx-auto mb-4 size-10 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Link inválido ou expirado</h1>
          <p className="mt-1 text-sm text-muted-foreground">Este link de convite não existe. Solicite um novo ao responsável do time.</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-4 size-12 text-green-500" />
          <h1 className="text-xl font-bold">Cadastro realizado!</h1>
          <p className="mt-2 text-sm text-muted-foreground">{success}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className="flex size-12 items-center justify-center rounded-xl text-lg font-bold text-white"
            style={{ backgroundColor: team?.primaryColor ?? '#6366f1' }}
          >
            {team?.acronym ?? team?.name.slice(0, 2).toUpperCase()}
          </div>
          <h1 className="font-display text-xl font-bold">{team?.name}</h1>
          {team?.city && <p className="text-xs text-muted-foreground">{team.city}</p>}
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="size-4" />
              Cadastro de Jogador
            </CardTitle>
            <CardDescription className="text-xs">
              Preencha seus dados para entrar no time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="João da Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="birthdate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nascimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="jerseyNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} placeholder="10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="document"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mainPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posição</FormLabel>
                      <FormControl>
                        <Input placeholder="Atacante, Goleiro..." {...field} />
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
                  Entrar no Time
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">Copa Fácil — Gestão de Campeonatos</p>
      </div>
    </div>
  )
}
