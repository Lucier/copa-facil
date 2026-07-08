'use client'
import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertTriangle className="size-7 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-xl font-semibold">Algo deu errado</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60">Código: {error.digest}</p>
        )}
      </div>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <RefreshCw className="size-4" />
        Tentar novamente
      </button>
    </div>
  )
}
