import Link from 'next/link'
import { getStockItemsList } from '@/lib/stock-items'
import { requireAdmin } from '@/lib/dal'
import { parsePage, parsePageSize } from '@/lib/pagination'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { buttonVariants } from '@/components/ui/button'
import { PaginationControls } from '../pagination-controls'
import { CreateStockItemForm } from './create-stock-item-form'
import { DeleteStockItemButton } from './delete-stock-item-button'

export default async function StockItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}) {
  await requireAdmin()
  const { page: pageParam, pageSize: pageSizeParam } = await searchParams
  const page = parsePage(pageParam)
  const pageSize = parsePageSize(pageSizeParam)
  const allItems = await getStockItemsList()
  const totalPages = Math.max(1, Math.ceil(allItems.length / pageSize))
  const items = allItems.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="font-heading text-lg font-medium">Stock Items</h1>
      <Card>
        <CardHeader>
          <CardTitle>Add an item</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateStockItemForm />
        </CardContent>
      </Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Link href={`/stock-items/${item.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                    Edit
                  </Link>
                  <DeleteStockItemButton id={item.id} name={item.name} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationControls basePath="/stock-items" page={page} pageSize={pageSize} totalPages={totalPages} />
    </div>
  )
}
