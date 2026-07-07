import Link from 'next/link'
import { Zap } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export function PublicFooter({ tenant, orgName }: { tenant: string; orgName: string }) {
  const base = `/${tenant}`
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border/40 bg-card/50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
                <Zap className="size-4 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <span className="font-display font-bold">{orgName}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Portal oficial de campeonatos esportivos. Acompanhe resultados, tabelas e notícias em tempo real.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Portal</p>
            <nav className="flex flex-col gap-2">
              {[
                { href: '', label: 'Início' },
                { href: '/championships', label: 'Campeonatos' },
                { href: '/matches', label: 'Partidas' },
                { href: '/standings', label: 'Tabela' },
                { href: '/news', label: 'Notícias' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={`${base}${link.href}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Organização</p>
            <nav className="flex flex-col gap-2">
              {[
                { href: '/teams', label: 'Times Participantes' },
                { href: '/statistics', label: 'Estatísticas' },
                { href: `/${tenant}/admin`, label: 'Área Administrativa' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <Separator className="my-6 bg-border/40" />

        <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {year} {orgName}. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by{' '}
            <span className="text-primary font-semibold">Cerrados Esportes</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
