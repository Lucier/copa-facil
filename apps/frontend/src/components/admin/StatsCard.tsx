import * as React from 'react'
import type { LucideIcon} from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: number
  trendLabel?: string
  className?: string
  highlight?: boolean
}

export function StatsCard({ label, value, icon: Icon, trend, trendLabel, className, highlight }: StatsCardProps) {
  const TrendIcon = trend === undefined || trend === 0 ? Minus : trend > 0 ? TrendingUp : TrendingDown
  const trendColor = trend === undefined || trend === 0
    ? 'text-muted-foreground'
    : trend > 0
    ? 'text-emerald-400'
    : 'text-red-400'

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-200',
        'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
        highlight && 'border-primary/40 bg-primary/5',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
          <p
            className={cn(
              'font-display text-3xl font-bold tracking-tight',
              highlight ? 'text-primary' : 'text-foreground',
            )}
          >
            {value}
          </p>
          {trend !== undefined && (
            <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
              <TrendIcon className="size-3" />
              <span>
                {trend > 0 ? '+' : ''}{trend}% {trendLabel ?? 'vs. mês anterior'}
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex size-11 items-center justify-center rounded-lg',
            highlight ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground',
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>

      {highlight && (
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-primary/8 via-transparent to-transparent" />
      )}
    </div>
  )
}
