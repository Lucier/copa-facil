'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

type Period = 'mensal' | 'trimestral' | 'semestral' | 'anual'

const PERIODS: { key: Period; label: string; suffix: string }[] = [
  { key: 'mensal', label: 'Mensal', suffix: '/mês' },
  { key: 'trimestral', label: 'Trimestral', suffix: '/trimestre' },
  { key: 'semestral', label: 'Semestral', suffix: '/semestre' },
  { key: 'anual', label: 'Anual', suffix: '/ano' },
]

const PLANS: {
  name: string
  description: string
  prices: Record<Period, number>
  features: string[]
  cta: string
  href: string
  highlight: boolean
}[] = [
  {
    name: 'Campeonatos Pequenos',
    description: 'Ideal para torneios de bairro e entre amigos.',
    prices: { mensal: 20, trimestral: 60, semestral: 100, anual: 200 },
    features: ['1 campeonato ativo', 'Até 8 times', 'Até 30 jogadores', 'Portal público'],
    cta: 'Assinar agora',
    href: '/register',
    highlight: false,
  },
  {
    name: 'Campeonatos Intermediários',
    description: 'Para ligas amadoras em crescimento.',
    prices: { mensal: 25, trimestral: 80, semestral: 135, anual: 250 },
    features: ['Até 3 campeonatos ativos', 'Até 16 times', 'Jogadores ilimitados', 'Portal público', 'Estatísticas avançadas'],
    cta: 'Assinar agora',
    href: '/register',
    highlight: true,
  },
  {
    name: 'Campeonatos Grandes',
    description: 'Para competições com muitos times e rodadas.',
    prices: { mensal: 35, trimestral: 95, semestral: 175, anual: 300 },
    features: ['Campeonatos ilimitados', 'Times ilimitados', 'Jogadores ilimitados', 'Estatísticas avançadas', 'Suporte prioritário'],
    cta: 'Assinar agora',
    href: '/register',
    highlight: false,
  },
  {
    name: 'Organizador Profissional',
    description: 'Para ligas profissionais e federações.',
    prices: { mensal: 50, trimestral: 135, semestral: 250, anual: 450 },
    features: ['Tudo do plano Grande', 'Múltiplas organizações', 'API de integração', 'Relatórios exportáveis', 'Onboarding dedicado'],
    cta: 'Falar com vendas',
    href: '/register',
    highlight: false,
  },
]

function formatBRL(value: number) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

export function PricingSection() {
  const [period, setPeriod] = useState<Period>('mensal')
  const suffix = PERIODS.find((p) => p.key === period)!.suffix

  return (
    <section id="plans" className="border-b border-border/40 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight">Planos para todo tipo de campeonato</h2>
          <p className="mt-3 text-muted-foreground">Escolha o período de assinatura e economize nos planos mais longos.</p>
        </div>

        {/* Period selector */}
        <div className="mb-12 flex justify-center">
          <div className="inline-flex rounded-lg border border-border bg-card p-1" role="tablist" aria-label="Período de assinatura">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                role="tab"
                aria-selected={period === p.key}
                onClick={() => setPeriod(p.key)}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                  period === p.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                plan.highlight
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                  : 'border-border bg-card'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">
                    MAIS POPULAR
                  </span>
                </div>
              )}

              <div className="mb-4">
                <p className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">{plan.name}</p>
                <div className="mt-2 flex items-end gap-1">
                  <span className="font-display text-3xl font-bold">{formatBRL(plan.prices[period])}</span>
                  <span className="mb-1 text-sm text-muted-foreground">{suffix}</span>
                </div>
                {period !== 'mensal' && (
                  <p className="mt-1 text-xs text-primary">
                    equivale a {formatBRL(plan.prices[period] / { trimestral: 3, semestral: 6, anual: 12 }[period])}/mês
                  </p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  plan.highlight
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:opacity-90'
                    : 'border border-border bg-background hover:bg-accent/50'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
