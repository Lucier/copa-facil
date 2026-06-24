import { boolean, date, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const championships = pgTable('championships', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  season: text('season').notNull(),
  format: text('format', {
    enum: ['pontos_corridos', 'mata_mata', 'grupos_mata_mata'],
  })
    .notNull()
    .default('pontos_corridos'),
  legs: integer('legs').notNull().default(1),
  status: text('status', { enum: ['draft', 'active', 'finished'] }).default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  acronym: text('acronym'),
  city: text('city'),
  nickname: text('nickname'),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color'),
  secondaryColor: text('secondary_color'),
  seed: integer('seed'),
  inviteToken: uuid('invite_token').defaultRandom().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull(),
  fullName: text('full_name').notNull(),
  birthdate: date('birthdate'),
  document: text('document'),
  documentType: text('document_type', { enum: ['cpf', 'passaporte'] }).notNull().default('cpf'),
  jerseyNumber: integer('jersey_number'),
  preferredFoot: text('preferred_foot', {
    enum: ['direito', 'esquerdo', 'ambidestro'],
  })
    .notNull()
    .default('direito'),
  mainPosition: text('main_position').notNull().default('goleiro'),
  subPositions: jsonb('sub_positions').notNull().default([]),
  goals: integer('goals').notNull().default(0),
  yellowCards: integer('yellow_cards').notNull().default(0),
  redCards: integer('red_cards').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const playerHistory = pgTable('player_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id').notNull(),
  championshipId: uuid('championship_id'),
  fromTeamId: uuid('from_team_id'),
  toTeamId: uuid('to_team_id'),
  goals: integer('goals').notNull().default(0),
  yellowCards: integer('yellow_cards').notNull().default(0),
  redCards: integer('red_cards').notNull().default(0),
  season: text('season'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const staffMembers = pgTable('staff_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull(),
  fullName: text('full_name').notNull(),
  document: text('document'),
  licenseNumber: text('license_number'),
  role: text('role', {
    enum: ['tecnico', 'auxiliar', 'medico', 'preparador_fisico'],
  })
    .notNull()
    .default('auxiliar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  championshipId: uuid('championship_id').notNull(),
  name: text('name').notNull(),
  orderIndex: integer('order_index').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const groupTeams = pgTable('group_teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull(),
  teamId: uuid('team_id').notNull(),
  seed: integer('seed').notNull().default(0),
})

export const rounds = pgTable('rounds', {
  id: uuid('id').primaryKey().defaultRandom(),
  championshipId: uuid('championship_id').notNull(),
  number: integer('number').notNull(),
  name: text('name').notNull(),
  phase: text('phase', { enum: ['group', 'knockout'] }).notNull().default('knockout'),
  groupId: uuid('group_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  championshipId: uuid('championship_id').notNull(),
  roundId: uuid('round_id').notNull(),
  homeTeamId: uuid('home_team_id'),
  awayTeamId: uuid('away_team_id'),
  groupId: uuid('group_id'),
  bracketSlot: integer('bracket_slot'),
  status: text('status', {
    enum: ['scheduled', 'live', 'finished', 'cancelled'],
  })
    .default('scheduled')
    .notNull(),
  scheduledAt: timestamp('scheduled_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const memberships = pgTable('memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  role: text('role').notNull().default('torcedor'),
  isActive: boolean('is_active').default(true).notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
})

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  action: text('action').notNull(),
  resource: text('resource'),
  resourceId: text('resource_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
