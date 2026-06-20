export const QUEUE_NAMES = {
  NOTIFICATIONS: 'notifications',
  EMAILS: 'emails',
  TENANT_PROVISIONING: 'tenant-provisioning',
} as const

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]
