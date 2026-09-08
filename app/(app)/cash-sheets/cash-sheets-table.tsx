'use client'

import Link from 'next/link'
import { tableFeatures, createColumnHelper } from '@tanstack/table-core'
import { useTable } from '@tanstack/react-table'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { formatINR } from '@/lib/currency'
import type { CashSheetListItem } from '@/lib/cash-sheets'
import { DeleteCashSheetButton } from './delete-cash-sheet-button'

const features = tableFeatures({})
const helper = createColumnHelper<typeof features, CashSheetListItem>()

const columns = helper.columns([
  helper.accessor('date', {
    header: 'Date',
    cell: (info) => (
      <Link href={`/cash-sheets/${info.getValue()}`} className="font-medium text-primary underline-offset-4 hover:underline">
        {info.getValue()}
      </Link>
    ),
  }),
  helper.accessor('openingBalance', { header: 'Opening', cell: (info) => formatINR(info.getValue()) }),
  helper.accessor('totalReceipts', { header: 'Total Receipt', cell: (info) => formatINR(info.getValue()) }),
  helper.accessor('totalPayments', { header: 'Total Payment', cell: (info) => formatINR(info.getValue()) }),
  helper.accessor('closingBalance', { header: 'Closing', cell: (info) => formatINR(info.getValue()) }),
  helper.accessor('updatedByName', { header: 'Saved By' }),
  helper.display({
    id: 'actions',
    header: 'Actions',
    cell: (info) => <DeleteCashSheetButton date={info.row.original.date} />,
  }),
])

export function CashSheetsTable({ data }: { data: CashSheetListItem[] }) {
  const table = useTable({ features, columns, data })

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No cash sheets recorded yet.</p>
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                <table.FlexRender header={header} />
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getAllCells().map((cell) => (
              <TableCell key={cell.id}>
                <table.FlexRender cell={cell} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
