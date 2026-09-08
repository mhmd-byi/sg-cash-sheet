'use server'

import { getCurrentUser } from '@/lib/dal'
import { getMyEntries, getAllEntries, getPendingEntries } from '@/lib/cash-sheets'
import { getMyStockEntries, getAllStockEntries, getPendingStockEntries } from '@/lib/stock-sheets'
import { formatINR } from '@/lib/currency'

const RESULT_LIMIT = 5

export interface GlobalSearchResult {
  key: string
  date: string
  title: string
  subtitle: string
  status: 'pending' | 'approved' | 'rejected'
  href: string
}

export interface GlobalSearchResponse {
  cash: GlobalSearchResult[]
  stock: GlobalSearchResult[]
}

export async function searchGlobal(query: string): Promise<GlobalSearchResponse> {
  const trimmed = query.trim()
  if (!trimmed) return { cash: [], stock: [] }

  const user = await getCurrentUser()
  const role = user?.role ?? 'maker'

  let cash: GlobalSearchResult[]
  if (role === 'admin') {
    const { rows } = await getAllEntries(1, RESULT_LIMIT, trimmed)
    cash = rows.map((row) => ({
      key: row.id,
      date: row.date,
      title: row.particular,
      subtitle: `${row.type === 'receipt' ? 'Receipt' : 'Payment'} · ${formatINR(row.amount)}`,
      status: row.status,
      href: `/cash-sheets/${row.date}`,
    }))
  } else if (role === 'checker') {
    const { rows } = await getPendingEntries(1, RESULT_LIMIT, trimmed)
    cash = rows.map((row) => ({
      key: row.id,
      date: row.date,
      title: row.particular,
      subtitle: `${row.type === 'receipt' ? 'Receipt' : 'Payment'} · ${formatINR(row.amount)}`,
      status: 'pending',
      href: '/approvals',
    }))
  } else {
    const { rows } = await getMyEntries(1, RESULT_LIMIT, trimmed)
    cash = rows.map((row, i) => ({
      key: `${row.date}-${i}`,
      date: row.date,
      title: row.particular,
      subtitle: `${row.type === 'receipt' ? 'Receipt' : 'Payment'} · ${formatINR(row.amount)}`,
      status: row.status,
      href: '/my-entries',
    }))
  }

  let stock: GlobalSearchResult[]
  if (role === 'admin') {
    const { rows } = await getAllStockEntries(1, RESULT_LIMIT, trimmed)
    stock = rows.map((row) => ({
      key: row.id,
      date: row.date,
      title: row.itemName,
      subtitle: `${row.type === 'receive' ? 'Receive' : 'Issue'} · ${row.qty} ${row.unit}`,
      status: row.status,
      href: `/stock-sheets/${row.date}`,
    }))
  } else if (role === 'checker') {
    const { rows } = await getPendingStockEntries(1, RESULT_LIMIT, trimmed)
    stock = rows.map((row) => ({
      key: row.id,
      date: row.date,
      title: row.itemName,
      subtitle: `${row.type === 'receive' ? 'Receive' : 'Issue'} · ${row.qty} ${row.unit}`,
      status: 'pending',
      href: '/approvals/stock',
    }))
  } else {
    const { rows } = await getMyStockEntries(1, RESULT_LIMIT, trimmed)
    stock = rows.map((row, i) => ({
      key: `${row.date}-${i}`,
      date: row.date,
      title: row.itemName,
      subtitle: `${row.type === 'receive' ? 'Receive' : 'Issue'} · ${row.qty} ${row.unit}`,
      status: row.status,
      href: '/my-stock-entries',
    }))
  }

  return { cash, stock }
}
