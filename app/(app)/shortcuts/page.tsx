import { getCurrentUser } from '@/lib/dal'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

export default async function ShortcutsPage() {
  const user = await getCurrentUser()
  const isAdmin = user?.role === 'admin'
  const isChecker = user?.role === 'checker'

  const navigationShortcuts = [
    { keys: 'G then H', description: 'Go to Home' },
    ...(user?.role !== 'checker'
      ? [
          { keys: 'G then E', description: 'Go to My Entries' },
          { keys: 'G then T', description: 'Go to My Stock Entries' },
        ]
      : []),
    ...(isAdmin || isChecker ? [{ keys: 'G then A', description: 'Go to Approvals' }] : []),
    { keys: 'G then N', description: 'Go to Notifications' },
    ...(isAdmin
      ? [
          { keys: 'G then D', description: 'Go to Dashboard' },
          { keys: 'G then C', description: 'Go to Cash Sheets' },
          { keys: 'G then S', description: 'Go to Stock Sheets' },
          { keys: 'G then I', description: 'Go to Stock Items' },
          { keys: 'G then U', description: 'Go to Users' },
        ]
      : []),
    { keys: '/', description: 'Focus the search bar' },
    { keys: '?', description: 'Open this help page' },
  ]

  const formShortcuts = [
    { keys: 'Ctrl+Enter (Cmd+Enter on Mac)', description: 'Save all rows — works from any field' },
    { keys: 'Ctrl+Shift+Enter (or Alt+Enter)', description: 'Add a new row to the section you’re currently in' },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-lg font-medium">Keyboard Shortcuts</h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          Press the keys one after another, not at the same time (e.g. tap <span className="font-mono">G</span> then{' '}
          <span className="font-mono">E</span>). Shortcuts are disabled while you&apos;re typing in a field.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Navigation</h2>
        <Table className="max-w-md">
          <TableHeader>
            <TableRow>
              <TableHead>Shortcut</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {navigationShortcuts.map((shortcut) => (
              <TableRow key={shortcut.keys}>
                <TableCell className="font-mono">{shortcut.keys}</TableCell>
                <TableCell>{shortcut.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">While filling out a form</h2>
        <Table className="max-w-md">
          <TableHeader>
            <TableRow>
              <TableHead>Shortcut</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formShortcuts.map((shortcut) => (
              <TableRow key={shortcut.keys}>
                <TableCell className="font-mono">{shortcut.keys}</TableCell>
                <TableCell>{shortcut.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
