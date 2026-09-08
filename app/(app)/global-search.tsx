'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { StatusBadge } from './status-badge'
import { searchGlobal, type GlobalSearchResponse } from './global-search-actions'

export function GlobalSearch() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GlobalSearchResponse | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults(null)
      return
    }

    const timeout = setTimeout(() => {
      startTransition(async () => {
        const response = await searchGlobal(trimmed)
        setResults(response)
        setIsOpen(true)
      })
    }, 300)

    return () => clearTimeout(timeout)
  }, [query])

  function handleSelect(href: string) {
    setIsOpen(false)
    setQuery('')
    setResults(null)
    router.push(href)
  }

  const hasResults = !!results && (results.cash.length > 0 || results.stock.length > 0)

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="global-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder="Search entries…"
          aria-label="Search entries"
          className="pl-8"
        />
      </div>

      {isOpen && query.trim() && (
        <div className="absolute z-50 mt-1 max-h-96 w-full overflow-y-auto rounded-lg border bg-background py-1 shadow-md">
          {isPending ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
          ) : !hasResults ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No results.</p>
          ) : (
            <>
              {results.cash.length > 0 && (
                <div>
                  <p className="px-3 py-1 text-xs font-medium text-muted-foreground">Cash</p>
                  {results.cash.map((row) => (
                    <button
                      key={row.key}
                      type="button"
                      onClick={() => handleSelect(row.href)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm hover:bg-muted"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">{row.title}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {row.subtitle} · {row.date}
                        </span>
                      </span>
                      <StatusBadge status={row.status} />
                    </button>
                  ))}
                </div>
              )}
              {results.stock.length > 0 && (
                <div>
                  <p className="px-3 py-1 text-xs font-medium text-muted-foreground">Stock</p>
                  {results.stock.map((row) => (
                    <button
                      key={row.key}
                      type="button"
                      onClick={() => handleSelect(row.href)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm hover:bg-muted"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">{row.title}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {row.subtitle} · {row.date}
                        </span>
                      </span>
                      <StatusBadge status={row.status} />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
