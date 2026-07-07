import type { Metadata } from 'next'
import { PublicNavbar } from '@/components/portal/PublicNavbar'
import { PublicFooter } from '@/components/portal/PublicFooter'

interface Props {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}

function formatOrgName(slug: string) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant } = await params
  const orgName = formatOrgName(tenant)

  return {
    title: {
      default: `${orgName} — Cerrados Esportes`,
      template: `%s | ${orgName}`,
    },
    description: `Acompanhe campeonatos, resultados, tabela e notícias de ${orgName} em tempo real.`,
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      siteName: 'Cerrados Esportes',
      title: `${orgName} — Cerrados Esportes`,
      description: `Campeonatos, resultados e notícias de ${orgName}.`,
    },
    twitter: {
      card: 'summary_large_image',
    },
    robots: { index: true, follow: true },
    alternates: {
      canonical: `https://cerradosesportes.app/${tenant}`,
    },
  }
}

export default async function PublicPortalLayout({ children, params }: Props) {
  const { tenant } = await params
  const orgName = formatOrgName(tenant)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNavbar tenant={tenant} orgName={orgName} />
      <main className="flex-1">{children}</main>
      <PublicFooter tenant={tenant} orgName={orgName} />
    </div>
  )
}
