import * as React from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface PageProps {
  params: Promise<{ tenant: string }>
  searchParams: Promise<{
    status?: string
    collection_status?: string
    payment_id?: string
    external_reference?: string
  }>
}

const RESULT_CONFIG = {
  aprovado: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    title: 'Pagamento aprovado!',
    description: 'Seu pagamento foi confirmado com sucesso. Em breve você receberá um e-mail de confirmação.',
  },
  pendente: {
    icon: Clock,
    color: 'text-amber-400',
    title: 'Pagamento pendente',
    description: 'Seu pagamento está sendo processado. Você será notificado assim que for confirmado.',
  },
  recusado: {
    icon: XCircle,
    color: 'text-destructive',
    title: 'Pagamento recusado',
    description: 'Não foi possível processar seu pagamento. Tente novamente ou escolha outra forma de pagamento.',
  },
} as const

type ResultKey = keyof typeof RESULT_CONFIG

function normalizeStatus(status?: string, collectionStatus?: string): ResultKey {
  const raw = status ?? collectionStatus ?? ''
  if (raw === 'aprovado' || raw === 'approved') return 'aprovado'
  if (raw === 'pendente' || raw === 'pending' || raw === 'in_process') return 'pendente'
  return 'recusado'
}

export default async function PagamentoPage({ params, searchParams }: PageProps) {
  const { tenant } = await params
  const { status, collection_status } = await searchParams

  const key = normalizeStatus(status, collection_status)
  const config = RESULT_CONFIG[key]
  const Icon = config.icon

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-6 py-10 text-center">
          <Icon className={`size-16 ${config.color}`} />
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold">{config.title}</h1>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
          <Button asChild>
            <Link href={`/${tenant}`}>Voltar ao início</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
