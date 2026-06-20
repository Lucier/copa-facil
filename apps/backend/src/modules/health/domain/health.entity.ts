export type HealthStatus = 'ok' | 'degraded' | 'down'

export interface ServiceHealth {
  name: string
  status: HealthStatus
  latencyMs?: number
}

export interface HealthCheck {
  status: HealthStatus
  version: string
  timestamp: Date
  services: ServiceHealth[]
}
