import type { ElementType, LevelKey } from '../c4'
import type { Category } from '../fields'

// A shelf is its file: the category is written once at the top and stamped on
// everything below it, and a type names its level only when it is not a
// container. The cast keeps the keys literal, so TypeKey stays the exact union
// and a category the field table has no line for is still a compile error.
type Entry = Omit<ElementType, 'category' | 'level'> & { level?: LevelKey }

export const shelf = <T extends Record<string, Entry>>(category: Category, types: T) =>
  Object.fromEntries(
    Object.entries(types).map(([key, type]) => [key, { level: 'container', ...type, category }]),
  ) as { [K in keyof T]: ElementType }
