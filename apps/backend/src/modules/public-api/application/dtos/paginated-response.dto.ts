export interface PaginatedMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponseDto<T> {
  data: T[]
  meta: PaginatedMeta
}

export function toPaginated<T>(
  data: T[],
  options: { page: number; limit: number; total: number },
): PaginatedResponseDto<T> {
  const totalPages = options.total === 0 ? 0 : Math.ceil(options.total / options.limit)
  return {
    data,
    meta: {
      page: options.page,
      limit: options.limit,
      total: options.total,
      totalPages,
      hasNext: options.page < totalPages,
      hasPrev: options.page > 1,
    },
  }
}
