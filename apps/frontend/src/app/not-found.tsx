'use client'
import Link from 'next/link'
import { Trophy, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
        <Trophy className="size-7 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-5xl font-bold tracking-tight text-primary">404</h1>
        <h2 className="font-display text-xl font-semibold">Página não encontrada</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          A página que você está procurando não existe ou foi movida.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent/50"
      >
        <ArrowLeft className="size-4" />
        Voltar ao início
      </Link>
    </div>
  )
}
