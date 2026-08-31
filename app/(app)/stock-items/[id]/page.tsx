import { notFound } from 'next/navigation'
import { getStockItemById } from '@/lib/stock-items'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { EditStockItemForm } from './edit-stock-item-form'

export default async function EditStockItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await getStockItemById(id)
  if (!item) notFound()

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="font-heading text-lg font-medium">Edit Item</h1>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>{item.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <EditStockItemForm item={item} />
        </CardContent>
      </Card>
    </div>
  )
}
