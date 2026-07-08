'use client'
import * as React from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UserPlus, CheckCircle2, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form'
import { registerPlayerSchema, type RegisterPlayerInput } from '@/lib/zod-schemas'
import api from '@/services/api'

const POSITIONS = [
  'Goleiro', 'Zagueiro', 'Lateral Direito', 'Lateral Esquerdo',
  'Volante', 'Meio-Campo', 'Meia Atacante', 'Atacante',
  'Ponta Direita', 'Ponta Esquerda',
]

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

interface TeamInfo {
  id: string
  name: string
  acronym: string | null
  city: string | null
  nickname: string | null
  primaryColor: string | null
}

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

  const form = useForm<RegisterPlayerInput>({
    resolver: zodResolver(registerPlayerSchema),
    defaultValues: {
      fullName: '',
      birthdate: '',
      document: '',
      documentType: 'cpf',
      jerseyNumber: undefined,
      preferredFoot: 'direito',
      mainPosition: '',
      subPositions: [],
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: RegisterPlayerInput) {
    setServerError(null)
    try {
      const { data } = await api.post<{ message: string }>(`/teams/join/${token}`, values, {
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
          <p className="mt-1 text-sm text-muted-foreground">
            Este link de convite não existe. Solicite um novo ao responsável do time.
          </p>
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
      <div className="w-full max-w-lg space-y-6">
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
                        <Input placeholder="Carlos Eduardo Mendes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="birthdate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value ?? ''} />
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
                        <FormLabel>Número da Camisa</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={99}
                            placeholder="10"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const v = (e.target as HTMLInputElement).value
                              field.onChange(v === '' ? undefined : Number(v))
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="document"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Documento</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <FormControl>
                          <select {...field} className={SELECT_CLASS}>
                            <option value="cpf">CPF</option>
                            <option value="passaporte">Passaporte</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mainPosition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Posição Principal *</FormLabel>
                        <FormControl>
                          <select {...field} className={SELECT_CLASS}>
                            <option value="">Selecione...</option>
                            {POSITIONS.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferredFoot"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pé Preferido</FormLabel>
                        <FormControl>
                          <select {...field} className={SELECT_CLASS}>
                            <option value="direito">Direito</option>
                            <option value="esquerdo">Esquerdo</option>
                            <option value="ambidestro">Ambidestro</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
