import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export const registerStep1Schema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

export const registerStep2Schema = z.object({
  organizationName: z.string().min(3, 'Nome da organização deve ter pelo menos 3 caracteres'),
  organizationSlug: z
    .string()
    .min(3, 'Identificador deve ter pelo menos 3 caracteres')
    .max(30, 'Identificador deve ter no máximo 30 caracteres')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use apenas letras minúsculas, números e hífens'),
  plan: z.enum(['starter', 'professional', 'liga']),
})

export type RegisterStep1Input = z.infer<typeof registerStep1Schema>
export type RegisterStep2Input = z.infer<typeof registerStep2Schema>

export const createChampionshipSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  season: z.string().min(4, 'Temporada inválida'),
  format: z.enum(['pontos_corridos', 'mata_mata', 'grupos_mata_mata']),
  legs: z.number().int().min(1).max(2),
})

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um hex válido (ex: #FF0000)')
  .optional()
  .or(z.literal(''))
  .transform((v) => v || undefined)

export const createTeamSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  acronym: z.string().max(4, 'Sigla: máximo 4 caracteres').optional().or(z.literal('')).transform((v) => v || undefined),
  city: z.string().optional().or(z.literal('')).transform((v) => v || undefined),
  nickname: z.string().optional().or(z.literal('')).transform((v) => v || undefined),
  primaryColor: hexColor,
  secondaryColor: hexColor,
})

export const registerPlayerSchema = z.object({
  fullName: z.string().min(3, 'Nome completo obrigatório'),
  birthdate: z.string().optional().or(z.literal('')).transform((v) => v || undefined),
  document: z.string().optional().or(z.literal('')).transform((v) => v || undefined),
  documentType: z.enum(['cpf', 'passaporte']).optional(),
  jerseyNumber: z.number().int().min(1).max(99).optional(),
  preferredFoot: z.enum(['direito', 'esquerdo', 'ambidestro']).optional(),
  mainPosition: z.string().min(1, 'Posição obrigatória'),
  subPositions: z.array(z.string()).optional(),
})

export const createPaymentSchema = z.object({
  championshipId: z.string().optional().or(z.literal('')).transform((v) => v || undefined),
  referenceId: z.string().optional().or(z.literal('')).transform((v) => v || undefined),
  referenceType: z.string().optional().or(z.literal('')).transform((v) => v || undefined),
  amountBrl: z.number().positive('Valor deve ser maior que zero'),
  method: z.enum(['pix', 'boleto', 'cartao_credito']),
  category: z.enum(['inscricao', 'patrocinio', 'receita_avulsa']),
  description: z.string().min(3, 'Descrição obrigatória'),
  payerEmail: z.string().email('E-mail inválido').optional().or(z.literal('')).transform((v) => v || undefined),
  ttlMinutes: z.number().int().min(1).max(1440).optional(),
  payerName: z.string().optional().or(z.literal('')).transform((v) => v || undefined),
  payerDocument: z.string().optional().or(z.literal('')).transform((v) => v || undefined),
  dueDate: z.string().optional().or(z.literal('')).transform((v) => v || undefined),
  cardToken: z.string().optional().or(z.literal('')).transform((v) => v || undefined),
  installments: z.number().int().min(1).max(12).optional(),
})

export const refundPaymentSchema = z.object({
  amountBrl: z.number().positive().optional(),
})

export const submitRegistrationSchema = z.object({
  championshipId: z.string().uuid('Selecione um campeonato'),
  teamId: z.string().uuid('Selecione um time'),
})

export const reviewRegistrationSchema = z.object({
  reviewNote: z.string().optional().or(z.literal('')).transform((v) => v || undefined),
})

export const concludeMatchSchema = z.object({
  homeScore: z.number().int().min(0, 'Placar inválido'),
  awayScore: z.number().int().min(0, 'Placar inválido'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type CreateChampionshipInput = z.infer<typeof createChampionshipSchema>
export type CreateTeamInput = z.infer<typeof createTeamSchema>
export type RegisterPlayerInput = z.infer<typeof registerPlayerSchema>
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>
export type SubmitRegistrationInput = z.infer<typeof submitRegistrationSchema>
export type ReviewRegistrationInput = z.infer<typeof reviewRegistrationSchema>
export type ConcludeMatchInput = z.infer<typeof concludeMatchSchema>
