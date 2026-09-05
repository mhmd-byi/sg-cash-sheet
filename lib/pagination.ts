export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
export const DEFAULT_PAGE_SIZE: number = 20

export interface Paginated<T> {
  rows: T[]
  page: number
  pageSize: number
  totalPages: number
}

export function parsePage(value: string | undefined): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export function parsePageSize(value: string | undefined): number {
  const size = Number(value)
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE
}

export function toPaginated<T>(rows: T[], total: number, page: number, pageSize: number): Paginated<T> {
  return { rows, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
}
