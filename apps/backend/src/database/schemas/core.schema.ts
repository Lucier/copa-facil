import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  schemaName: text('schema_name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').notNull().default('torcedor'),
  token: text('token').notNull().unique(),
  status: text('status').notNull().default('pending'),
  invitedBy: uuid('invited_by')
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  isActive: boolean('is_active').notNull().default(true),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const organizationsRelations = relations(organizations, ({ many }) => ({
  invitations: many(invitations),
  apiKeys: many(apiKeys),
}))

export const invitationsRelations = relations(invitations, ({ one }) => ({
  org: one(organizations, { fields: [invitations.orgId], references: [organizations.id] }),
  inviter: one(users, { fields: [invitations.invitedBy], references: [users.id] }),
}))

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  organization: one(organizations, { fields: [apiKeys.organizationId], references: [organizations.id] }),
}))
