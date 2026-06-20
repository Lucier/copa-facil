export type UserRole =
  | 'super_admin'
  | 'organizador'
  | 'arbitro'
  | 'comissao_tecnica'
  | 'jogador'
  | 'torcedor'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
}

export interface Tenant {
  slug: string
  name: string
  schemaName: string
}

export interface Match {
  id: string
  championship: string
  round: string
  home: string
  homeScore: number | null
  away: string
  awayScore: number | null
  status: 'scheduled' | 'live' | 'finished'
  scheduledAt: string
  venue?: string
}

export interface MatchEvent {
  id: string
  minute: number
  type: 'goal' | 'yellow' | 'red' | 'sub'
  team: 'home' | 'away'
  player: string
  detail?: string
}

export interface StandingRow {
  pos: number
  team: string
  pts: number
  pj: number
  v: number
  e: number
  d: number
  sg: number
  form: string[]
}

export interface NewsArticle {
  slug: string
  title: string
  excerpt: string
  category: string
  publishedAt: string
}

export interface RegisterMatchEventDto {
  matchId: string
  type: 'GOL' | 'CARTAO' | 'SUBSTITUICAO' | 'EXPULSAO'
  teamSide: 'home' | 'away'
  playerId: string
  minute: number
  goalType?: 'NORMAL' | 'PENALTI' | 'CONTRA'
  cardColor?: 'AMARELO' | 'VERMELHO'
}
