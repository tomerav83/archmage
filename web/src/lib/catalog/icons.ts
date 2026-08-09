// The glyphs the catalog names. lucide-react ships each icon as its own component,
// so the bundle carries exactly these six and nothing phones home for the rest.
import { AppWindow, Box, Database, Group, Puzzle, User, type LucideIcon } from 'lucide-react'

export const ICONS: Record<string, LucideIcon> = {
  'lucide:user': User,
  'lucide:box': Box,
  'lucide:app-window': AppWindow,
  'lucide:database': Database,
  'lucide:puzzle': Puzzle,
  'lucide:group': Group,
}
