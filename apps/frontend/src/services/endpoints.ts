export const API = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
  },
  championships: {
    base: '/championships',
    byId: (id: string) => `/championships/${id}`,
    matches: (id: string) => `/championships/${id}/matches`,
    fixtures: (id: string) => `/championships/${id}/generate-fixtures`,
    standings: (id: string) => `/championships/${id}/standings`,
    statistics: (id: string, type: string) => `/championships/${id}/statistics/${type}`,
  },
  teams: {
    base: '/teams',
    byId: (id: string) => `/teams/${id}`,
    players: (teamId: string) => `/teams/${teamId}/players`,
    playerById: (teamId: string, playerId: string) => `/teams/${teamId}/players/${playerId}`,
    staff: (teamId: string) => `/teams/${teamId}/staff`,
  },
  matches: {
    start: (id: string) => `/matches/${id}/start`,
    conclude: (id: string) => `/matches/${id}/conclude`,
    events: (id: string) => `/matches/${id}/events`,
  },
  registrations: {
    base: '/registrations',
    byId: (id: string) => `/registrations/${id}`,
    approve: (id: string) => `/registrations/${id}/approve`,
    reject: (id: string) => `/registrations/${id}/reject`,
    documents: (id: string) => `/registrations/${id}/documents`,
  },
  payments: {
    base: '/payments',
    refund: (id: string) => `/payments/${id}/refund`,
    ledger: (championshipId: string) => `/payments/ledger/${championshipId}`,
  },
  cms: {
    articles: '/articles',
    galleries: '/galleries',
    videos: '/videos',
  },
} as const
