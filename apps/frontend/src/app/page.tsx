import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Trophy, Zap, Users, BarChart3, CalendarDays, Shield,
  CheckCircle2, ChevronRight, ArrowRight, Star,
} from 'lucide-react'
import { PricingSection } from '@/components/landing/pricing-section'

const DEMO_TENANT = process.env.NEXT_PUBLIC_DEMO_TENANT ?? 'demo'

export const metadata: Metadata = {
  title: 'Copa Fácil — Gestão de Campeonatos Esportivos',
  description: 'A plataforma mais simples para gerenciar campeonatos de futebol e futsal. Tabelas, partidas, estatísticas e muito mais.',
}

const FEATURES = [
  {
    icon: Zap,
    title: 'Geração Automática',
    description: 'Crie a tabela de jogos em segundos. Suporte a pontos corridos, mata-mata e grupos.',
  },
  {
    icon: BarChart3,
    title: 'Estatísticas em Tempo Real',
    description: 'Artilharia, assistências, fair play e classificação atualizados automaticamente.',
  },
  {
    icon: Users,
    title: 'Gestão de Times e Jogadores',
    description: 'Cadastro completo de times, elencos, posições e documentos dos atletas.',
  },
  {
    icon: CalendarDays,
    title: 'Agenda de Partidas',
    description: 'Organize datas, horários e locais de cada partida com facilidade.',
  },
  {
    icon: Trophy,
    title: 'Portal Público',
    description: 'Página dedicada para torcedores acompanharem resultados e classificação.',
  },
  {
    icon: Shield,
    title: 'Multi-organização',
    description: 'Cada organização tem seu ambiente isolado e personalizado.',
  },
]

const CHECKLIST = [
  'Geração automática de partidas',
  'Classificação e artilharia em tempo real',
  'Link de convite para cadastro de jogadores',
  'Portal público por organização',
  'Suporte a múltiplos formatos de campeonato',
  'Estatísticas detalhadas por jogador e time',
  'Gerenciamento de rodadas e grupos',
  'Interface responsiva para celular',
]

const TESTIMONIALS = [
  {
    name: 'Carlos Mendes',
    role: 'Organizador de Torneio',
    text: 'Antes eu usava planilha e levava horas para montar a tabela. Agora gero tudo em minutos e os jogadores acompanham pelo celular.',
    stars: 5,
  },
  {
    name: 'Fernanda Rocha',
    role: 'Coordenadora de Futsal',
    text: 'O portal público foi o que me conquistou. Mando o link para os times e eles já veem tudo em tempo real.',
    stars: 5,
  },
  {
    name: 'Roberto Alves',
    role: 'Liga de Bairro',
    text: 'Gerencio 3 campeonatos ao mesmo tempo sem complicação. A geração automática de partidas é incrível.',
    stars: 5,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <Trophy className="size-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">Copa Fácil</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Recursos</a>
            <a href="#how" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Como funciona</a>
            <a href="#plans" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Planos</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={`/${DEMO_TENANT}/login`}
              className="hidden rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:block"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Começar grátis <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        <div className="pointer-events-none absolute -top-32 right-0 h-[500px] w-[500px] rounded-full bg-primary/8 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center lg:py-28">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            Plataforma 100% brasileira
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight lg:text-6xl">
            O jeito mais fácil de{' '}
            <span className="text-primary">gerenciar</span>
            <br />
            seu campeonato
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground lg:text-lg">
            Crie tabelas de jogos automáticas, acompanhe estatísticas em tempo real e compartilhe
            um portal público com times e torcedores. Tudo em minutos, sem complicação.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:opacity-90 hover:shadow-primary/40"
            >
              <Zap className="size-4" />
              Criar campeonato agora
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
            >
              Ver como funciona <ChevronRight className="size-4" />
            </a>
          </div>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-3 gap-6 border-t border-border/40 pt-10 lg:grid-cols-3">
            {[
              { value: '500+', label: 'Campeonatos criados' },
              { value: '12 mil', label: 'Jogadores cadastrados' },
              { value: '80 mil', label: 'Partidas geradas' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl font-bold text-primary lg:text-4xl">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground lg:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="border-b border-border/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="mt-3 text-muted-foreground">
              Do cadastro dos times à geração automática da tabela de jogos.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="size-5" />
                </div>
                <h3 className="font-display font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="border-b border-border/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Checklist */}
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight">
                Da inscrição ao pódio,{' '}
                <span className="text-primary">sem esforço</span>
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Nossa plataforma cuida de toda a burocracia de um campeonato para que você
                foque no que importa: a competição.
              </p>
              <ul className="mt-6 space-y-3">
                {CHECKLIST.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="size-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              {[
                { n: '01', title: 'Crie sua organização', desc: 'Cadastre-se em minutos e configure o ambiente da sua liga ou torneio.' },
                { n: '02', title: 'Cadastre times e jogadores', desc: 'Envie o link de convite para os times preencherem o elenco sozinhos.' },
                { n: '03', title: 'Gere a tabela automaticamente', desc: 'Escolha o formato (pontos corridos, mata-mata ou grupos) e pronto.' },
                { n: '04', title: 'Acompanhe em tempo real', desc: 'Lance resultados e veja classificação, artilharia e estatísticas atualizadas.' },
              ].map((step) => (
                <div key={step.n} className="flex gap-4 rounded-xl border border-border bg-card p-5">
                  <span className="font-display text-2xl font-bold text-primary/40 leading-none">{step.n}</span>
                  <div>
                    <p className="font-display font-bold">{step.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Plans ── */}
      <PricingSection />

      {/* ── Testimonials ── */}
      <section className="border-b border-border/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight">O que dizem nossos usuários</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-card p-6">
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="size-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">"{t.text}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary/15 font-display text-sm font-bold text-primary">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Access CTA ── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 px-8 py-14 text-center">
            <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 size-64 rounded-full bg-primary/8 blur-3xl" />

            <h2 className="relative font-display text-3xl font-bold tracking-tight lg:text-4xl">
              Pronto para começar?
            </h2>
            <p className="relative mt-3 text-muted-foreground">
              Acesse a plataforma como administrador ou acompanhe seu campeonato como torcedor.
            </p>

            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href={`/${DEMO_TENANT}/login`}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:opacity-90"
              >
                <Shield className="size-4" />
                Entrar como Administrador
              </Link>
              <Link
                href={`/${DEMO_TENANT}`}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-8 py-3.5 text-sm font-medium transition-colors hover:bg-accent/50"
              >
                <Trophy className="size-4 text-primary" />
                Ver portal de campeonatos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary">
                <Trophy className="size-3.5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold">Copa Fácil</span>
            </Link>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Recursos</a>
              <a href="#plans" className="hover:text-foreground transition-colors">Planos</a>
              <Link href={`/${DEMO_TENANT}`} className="hover:text-foreground transition-colors">Demonstração</Link>
              <Link href={`/${DEMO_TENANT}/login`} className="hover:text-foreground transition-colors">Entrar</Link>
            </div>

            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Copa Fácil. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
