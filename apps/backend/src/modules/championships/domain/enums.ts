export enum TournamentFormat {
  PONTOS_CORRIDOS = 'pontos_corridos',
  MATA_MATA = 'mata_mata',
  GRUPOS_MATA_MATA = 'grupos_mata_mata',
}

export enum ChampionshipStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  FINISHED = 'finished',
}

export enum MatchStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  FINISHED = 'finished',
  CANCELLED = 'cancelled',
}

export type RoundPhase = 'group' | 'knockout'
