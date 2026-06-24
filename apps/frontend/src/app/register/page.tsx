'use client'
import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Trophy, Loader2, CheckCircle2, ArrowLeft, ArrowRight,
  User, Building2, Zap, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import {
  registerStep1Schema, registerStep2Schema,
  type RegisterStep1Input, type RegisterStep2Input,
} from '@/lib/zod-schemas'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/services/api'
import { API } from '@/services/endpoints'

// ── helpers ──────────────────────────────────────────────────────────────────

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30)
}

// ── plans ─────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'starter' as const,
    name: 'Starter',
    price: 'Grátis',
    period: '',
    description: 'Para começar e conhecer a plataforma.',
    features: ['1 campeonato ativo', 'Até 8 times', '30 jogadores'],
  },
  {
    id: 'professional' as const,
    name: 'Profissional',
    price: 'R$ 49',
    period: '/mês',
    description: 'Para organizadores sérios.',
    features: ['Campeonatos ilimitados', 'Times ilimitados', 'Estatísticas avançadas'],
    highlight: true,
  },
  {
    id: 'liga' as const,
    name: 'Liga',
    price: 'R$ 99',
    period: '/mês',
    description: 'Para ligas e federações.',
    features: ['Tudo do Profissional', 'Múltiplas organizações', 'Suporte dedicado'],
  },
]

// ── steps indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Sua conta', icon: User },
  { label: 'Organização', icon: Building2 },
  { label: 'Confirmação', icon: CheckCircle2 },
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < current
        const active = i === current
        return (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex size-9 items-center justify-center rounded-full border-2 transition-all ${
                  done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground'
                }`}
              >
                {done ? <Check className="size-4" /> : <step.icon className="size-4" />}
              </div>
              <span className={`text-[11px] font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mb-4 h-px w-12 transition-colors ${done ? 'bg-primary' : 'bg-border'}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

interface TokenResponse {
  accessToken: string
  refreshToken: string
  user: { id: string; email: string; name: string }
}

export default function RegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [step, setStep] = React.useState(0)
  const [step1Data, setStep1Data] = React.useState<RegisterStep1Input | null>(null)
  const [step2Data, setStep2Data] = React.useState<RegisterStep2Input | null>(null)
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [done, setDone] = React.useState(false)
  const [createdSlug, setCreatedSlug] = React.useState('')

  // ── Step 1 form ──────────────────────────────────────────────────────────
  const form1 = useForm<RegisterStep1Input>({
    resolver: zodResolver(registerStep1Schema),
    mode: 'onChange',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  const passwordValue = form1.watch('password')

  function onStep1Submit(values: RegisterStep1Input) {
    setStep1Data(values)
    setStep(1)
  }

  // ── Step 2 form ──────────────────────────────────────────────────────────
  const form2 = useForm<RegisterStep2Input>({
    resolver: zodResolver(registerStep2Schema),
    defaultValues: { organizationName: '', organizationSlug: '', plan: 'starter' },
  })

  const orgName = form2.watch('organizationName')
  const selectedPlan = form2.watch('plan')

  // Auto-generate slug as org name is typed
  React.useEffect(() => {
    const slug = toSlug(orgName)
    if (slug) form2.setValue('organizationSlug', slug, { shouldValidate: false })
  }, [orgName, form2])

  function onStep2Submit(values: RegisterStep2Input) {
    setStep2Data(values)
    setStep(2)
  }

  // ── Step 3 — submit ──────────────────────────────────────────────────────
  async function handleRegister() {
    if (!step1Data || !step2Data) return
    setServerError(null)
    setSubmitting(true)
    try {
      const { data } = await api.post<TokenResponse>(API.auth.register, {
        name: step1Data.name,
        email: step1Data.email,
        password: step1Data.password,
        organizationName: step2Data.organizationName,
        organizationSlug: step2Data.organizationSlug,
      })
      setAuth({ id: data.user.id, name: data.user.name, email: data.user.email, role: 'organizador' })
      setCreatedSlug(step2Data.organizationSlug)
      setDone(true)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      setServerError(
        Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao criar conta. Tente novamente.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success screen ───────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="size-8 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Conta criada!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sua organização <span className="font-semibold text-foreground">{step2Data?.organizationName}</span> está pronta.
            </p>
          </div>
          <Button
            className="w-full gap-2"
            onClick={() => router.push(`/${createdSlug}/admin`)}
          >
            <Zap className="size-4" />
            Acessar painel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-xl space-y-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
              <Trophy className="size-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">Copa Fácil</span>
          </Link>
          <p className="text-sm text-muted-foreground">Crie sua conta e comece a organizar</p>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} />

        {/* ── Step 1: Conta ─────────────────────────────────────────── */}
        {step === 0 && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-4 font-display text-base font-bold">Seus dados de acesso</h2>
              <Form {...form1}>
                <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-4">
                  <FormField
                    control={form1.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome completo</FormLabel>
                        <FormControl>
                          <Input placeholder="João Silva" autoComplete="name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form1.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="joao@email.com" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form1.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form1.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {passwordValue && (
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                      {[
                        { label: 'Mínimo 8 caracteres', ok: passwordValue.length >= 8 },
                        { label: 'Letra maiúscula', ok: /[A-Z]/.test(passwordValue) },
                        { label: 'Letra minúscula', ok: /[a-z]/.test(passwordValue) },
                        { label: 'Número', ok: /[0-9]/.test(passwordValue) },
                        { label: 'Caractere especial', ok: /[^A-Za-z0-9]/.test(passwordValue) },
                      ].map(({ label, ok }) => (
                        <li key={label} className={`flex items-center gap-1.5 ${ok ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                          <CheckCircle2 className="size-3 shrink-0" />
                          {label}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button type="submit" className="w-full gap-2">
                    Próximo <ArrowRight className="size-4" />
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* ── Step 2: Organização + Plano ───────────────────────────── */}
        {step === 1 && (
          <Card>
            <CardContent className="pt-6 space-y-5">
              <h2 className="font-display text-base font-bold">Sua organização</h2>
              <Form {...form2}>
                <form onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-5">
                  <FormField
                    control={form2.control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da organização / liga</FormLabel>
                        <FormControl>
                          <Input placeholder="Liga Paulista de Futsal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form2.control}
                    name="organizationSlug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Identificador único (URL)</FormLabel>
                        <FormControl>
                          <div className="flex items-center rounded-md border border-input bg-muted/30 focus-within:ring-1 focus-within:ring-ring">
                            <span className="pl-3 text-xs text-muted-foreground select-none whitespace-nowrap">
                              copafacil.com/
                            </span>
                            <input
                              {...field}
                              className="flex-1 bg-transparent py-2 pr-3 text-sm outline-none placeholder:text-muted-foreground"
                              placeholder="liga-paulista"
                              onChange={(e) => field.onChange(toSlug(e.target.value))}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        <p className="text-[11px] text-muted-foreground">
                          Será o endereço público do portal: copafacil.com/{form2.watch('organizationSlug') || 'sua-liga'}
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* Plan selection */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Plano</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {PLANS.map((plan) => {
                        const isSelected = selectedPlan === plan.id
                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => form2.setValue('plan', plan.id)}
                            className={`relative rounded-xl border p-4 text-left transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'border-border bg-card hover:border-primary/40'
                            }`}
                          >
                            {plan.highlight && (
                              <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground">
                                POPULAR
                              </span>
                            )}
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{plan.name}</p>
                                <p className="font-display mt-0.5 text-lg font-bold">
                                  {plan.price}<span className="text-xs font-normal text-muted-foreground">{plan.period}</span>
                                </p>
                              </div>
                              {isSelected && (
                                <div className="flex size-5 items-center justify-center rounded-full bg-primary">
                                  <Check className="size-3 text-primary-foreground" />
                                </div>
                              )}
                            </div>
                            <ul className="mt-2 space-y-1">
                              {plan.features.map((f) => (
                                <li key={f} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                  <CheckCircle2 className="size-3 shrink-0 text-primary" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="gap-2" onClick={() => setStep(0)}>
                      <ArrowLeft className="size-4" /> Voltar
                    </Button>
                    <Button type="submit" className="flex-1 gap-2">
                      Revisar <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* ── Step 3: Confirmação ───────────────────────────────────── */}
        {step === 2 && step1Data && step2Data && (
          <Card>
            <CardContent className="pt-6 space-y-5">
              <h2 className="font-display text-base font-bold">Confirme seus dados</h2>

              <div className="rounded-lg border border-border bg-muted/30 divide-y divide-border text-sm">
                {[
                  { label: 'Nome', value: step1Data.name },
                  { label: 'E-mail', value: step1Data.email },
                  { label: 'Organização', value: step2Data.organizationName },
                  { label: 'URL', value: `copafacil.com/${step2Data.organizationSlug}` },
                  { label: 'Plano', value: PLANS.find((p) => p.id === step2Data.plan)?.name ?? step2Data.plan },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>

              {serverError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {serverError}
                </p>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="gap-2" onClick={() => setStep(1)}>
                  <ArrowLeft className="size-4" /> Voltar
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleRegister}
                  disabled={submitting}
                >
                  {submitting
                    ? <><Loader2 className="size-4 animate-spin" /> Criando...</>
                    : <><Zap className="size-4" /> Criar minha conta</>
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Já tem uma conta?{' '}
          <Link href="/demo/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
