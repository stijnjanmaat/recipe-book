import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type FilterFn,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { MoreVertical, Eye, Pencil, Trash2, Plus } from 'lucide-react'
import { useRecipes, useDeleteRecipe } from '~/hooks/useRecipes'
import type { Recipe } from '~/types/recipe'
import { detectLocaleFromPath } from '~/lib/i18n/config'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Alert, AlertDescription } from '~/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

// Type for recipe with database fields and relations
type RecipeWithId = Recipe & {
  id: number
  createdAt: Date | null
  updatedAt: Date | null
  servingsRelevant?: boolean // Converted from integer (0/1) to boolean in server
  ingredients?: Array<{
    id: number
    recipeId: number | null
    name: string
    amount: string | null
    unit: string | null
    notes: string | null
    order: number | null
  }>
  instructions?: Array<{
    id: number
    recipeId: number | null
    step: number
    instruction: string
    imageUrl: string | null
  }>
}

export function RecipeTable() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const routerState = useRouterState()
  // Detect locale from URL path
  const currentRoute = routerState.location.pathname
  const currentLocale = detectLocaleFromPath(currentRoute)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const { data: recipes = [], isLoading, error } = useRecipes()
  const deleteRecipe = useDeleteRecipe()

  const columns: ColumnDef<RecipeWithId>[] = [
    {
      accessorKey: 'imageBlobUrl',
      header: t('recipes.table.image'),
      cell: ({ row }) => {
        const imageUrl = row.original.imageBlobUrl || row.original.sourceImageUrl
        return (
          <Link
            to="/{-$locale}/recipes/$recipeId"
            params={{ 
              recipeId: row.original.id.toString(),
              locale: currentLocale === 'en' ? undefined : currentLocale
            }}
            className="block"
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={row.original.title}
                className="h-16 w-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="h-16 w-16 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs cursor-pointer hover:bg-muted/80 transition-colors">
                {t('recipes.table.noImage')}
              </div>
            )}
          </Link>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'title',
      header: t('recipes.table.title'),
      size: 300, // Target width in pixels
      cell: ({ row }) => (
        <Link
          to="/{-$locale}/recipes/$recipeId"
          params={{ 
            recipeId: row.original.id.toString(),
            locale: currentLocale === 'en' ? undefined : currentLocale
          }}
          className="font-medium text-primary hover:underline"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: 'description',
      header: t('recipes.table.description'),
      size: 400, // Target width in pixels
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground line-clamp-3">
          {row.original.description || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'cuisine',
      header: t('recipes.table.cuisine'),
      cell: ({ row }) => row.original.cuisine || '-',
    },
    {
      accessorKey: 'difficulty',
      header: t('recipes.table.difficulty'),
      cell: ({ row }) => {
        const difficulty = row.original.difficulty
        if (!difficulty) return '-'
        const colors = {
          easy: 'bg-green-100 text-green-800',
          medium: 'bg-yellow-100 text-yellow-800',
          hard: 'bg-red-100 text-red-800',
        }
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              colors[difficulty] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </span>
        )
      },
    },
    {
      accessorKey: 'prepTime',
      header: t('recipes.table.prepTime'),
      cell: ({ row }) => {
        const prepTime = row.original.prepTime
        return prepTime ? `${prepTime} ${t('common.minutes')}` : '-'
      },
    },
    {
      accessorKey: 'cookTime',
      header: t('recipes.table.cookTime'),
      cell: ({ row }) => {
        const cookTime = row.original.cookTime
        return cookTime ? `${cookTime} ${t('common.minutes')}` : '-'
      },
    },
    {
      accessorKey: 'servings',
      header: t('recipes.table.servings'),
      cell: ({ row }) => {
        const servings = row.original.servings
        const servingsRelevant = row.original.servingsRelevant !== false // Default to true if undefined
        if (!servingsRelevant) return '-'
        return servings || '-'
      },
    },
    {
      id: 'actions',
      header: t('recipes.table.actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link
              to="/{-$locale}/recipes/$recipeId"
              params={{ 
                recipeId: row.original.id.toString(),
                locale: currentLocale === 'en' ? undefined : currentLocale
              }}
            >
              <Eye className="size-4 md:mr-1.5" />
              <span className="hidden md:inline">{t('recipes.view')}</span>
            </Link>
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm(t('recipes.deleteConfirm', { title: row.original.title }))) {
                deleteRecipe.mutate(row.original.id)
              }
            }}
            variant="ghost"
            size="sm"
            disabled={deleteRecipe.isPending}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4 md:mr-1.5" />
            <span className="hidden md:inline">{deleteRecipe.isPending ? t('recipes.deleting') : t('common.delete')}</span>
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ]

  // Custom filter function that searches across multiple fields
  const globalFilterFn: FilterFn<RecipeWithId> = (row, columnId, filterValue) => {
    if (!filterValue || typeof filterValue !== 'string') return true
    
    const searchTerm = filterValue.toLowerCase()
    const recipe = row.original
    
    // Search in title
    if (recipe.title?.toLowerCase().includes(searchTerm)) return true
    
    // Search in description
    if (recipe.description?.toLowerCase().includes(searchTerm)) return true
    
    // Search in tags
    if (recipe.tags && Array.isArray(recipe.tags)) {
      if (recipe.tags.some(tag => tag?.toLowerCase().includes(searchTerm))) return true
    }
    
    // Search in ingredients
    if (recipe.ingredients) {
      for (const ing of recipe.ingredients) {
        if (ing.name?.toLowerCase().includes(searchTerm)) return true
        if (ing.amount?.toLowerCase().includes(searchTerm)) return true
        if (ing.unit?.toLowerCase().includes(searchTerm)) return true
        if (ing.notes?.toLowerCase().includes(searchTerm)) return true
      }
    }
    
    // Search in instructions
    if (recipe.instructions) {
      for (const inst of recipe.instructions) {
        if (inst.instruction?.toLowerCase().includes(searchTerm)) return true
      }
    }
    
    // Search in cuisine
    if (recipe.cuisine?.toLowerCase().includes(searchTerm)) return true
    
    return false
  }

  const table = useReactTable({
    data: recipes as RecipeWithId[],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">{t('recipes.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {t('recipes.error')}: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  const rows = table.getRowModel().rows

  return (
    <div className="space-y-3">
      {/* Search and filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <Input
          type="text"
          placeholder={t('recipes.search')}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full max-w-sm"
        />
        <div className="text-sm text-muted-foreground shrink-0">
          {table.getFilteredRowModel().rows.length}{' '}
          {table.getFilteredRowModel().rows.length !== 1 ? t('recipes.table.recipes') : t('recipes.table.recipe')}
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-1.5">
        {rows.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground text-sm">{t('recipes.noRecipes')}</p>
        ) : (
          rows.map((row) => {
            const r = row.original
            const imageUrl = r.imageBlobUrl || r.sourceImageUrl
            return (
              <Card
                key={row.id}
                variant="compact"
                className="overflow-hidden transition-colors active:bg-muted/50"
              >
                <div
                  className="flex gap-2 p-2"
                  onClick={() => navigate({ to: '/{-$locale}/recipes/$recipeId', params: { recipeId: r.id.toString(), locale: currentLocale === 'en' ? undefined : currentLocale } })}
                  onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLElement).click()}
                  role="button"
                  tabIndex={0}
                >
                  <div className="shrink-0 w-14 h-14 rounded overflow-hidden bg-muted">
                    {imageUrl ? (
                      <img src={imageUrl} alt={r.title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">{t('recipes.table.noImage')}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <h3 className="font-semibold text-foreground text-sm truncate">{r.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{r.description || '-'}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 size-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={t('recipes.table.actions')}
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem asChild>
                        <Link to="/{-$locale}/recipes/$recipeId" params={{ recipeId: r.id.toString(), locale: currentLocale === 'en' ? undefined : currentLocale }} onClick={(e) => e.stopPropagation()}>
                          <Eye className="size-4 mr-2" />
                          {t('recipes.view')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/{-$locale}/recipes/$recipeId/edit" params={{ recipeId: r.id.toString(), locale: currentLocale === 'en' ? undefined : currentLocale }} onClick={(e) => e.stopPropagation()}>
                          <Pencil className="size-4 mr-2" />
                          {t('common.edit')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(t('recipes.deleteConfirm', { title: r.title }))) deleteRecipe.mutate(r.id)
                        }}
                        disabled={deleteRecipe.isPending}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4 mr-2" />
                        {deleteRecipe.isPending ? t('recipes.deleting') : t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      header.column.getCanSort()
                        ? 'cursor-pointer select-none hover:text-foreground'
                        : ''
                    }
                    style={{
                      width: header.column.columnDef.size ? `${header.column.columnDef.size}px` : undefined,
                      maxWidth: header.column.columnDef.size ? `${header.column.columnDef.size}px` : undefined,
                      overflow: header.column.columnDef.size ? 'hidden' : undefined,
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-2">
                        {header.column.columnDef.header as string}
                        {{
                          asc: ' ↑',
                          desc: ' ↓',
                        }[header.column.getIsSorted() as string] ?? ''}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t('recipes.noRecipes')}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => {
                    // Navigate to recipe detail when row is clicked
                    navigate({ 
                      to: '/{-$locale}/recipes/$recipeId', 
                      params: { 
                        recipeId: row.original.id.toString(),
                        locale: currentLocale === 'en' ? undefined : currentLocale
                      } 
                    })
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        width: cell.column.columnDef.size ? `${cell.column.columnDef.size}px` : undefined,
                        maxWidth: cell.column.columnDef.size ? `${cell.column.columnDef.size}px` : undefined,
                        overflow: cell.column.columnDef.size ? 'hidden' : undefined,
                        whiteSpace: cell.column.columnDef.size ? 'normal' : undefined,
                      }}
                      onClick={(e) => {
                        // Prevent navigation if clicking on action buttons or links
                        const target = e.target as HTMLElement
                        if (
                          target.tagName === 'BUTTON' ||
                          target.tagName === 'A' ||
                          target.closest('button') ||
                          target.closest('a')
                        ) {
                          e.stopPropagation()
                        }
                      }}
                    >
                      {cell.renderValue() as React.ReactNode}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination - shared for mobile cards and desktop table */}
      {table.getPageCount() > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1 py-3">
          <div className="flex items-center justify-center gap-2 sm:justify-start flex-wrap">
            <Button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              variant="outline"
              size="sm"
              className="hidden sm:flex"
            >
              {t('recipes.table.first')}
            </Button>
            <Button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              variant="outline"
              size="sm"
            >
              {t('recipes.table.previous')}
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {t('recipes.table.page')} <strong>{table.getState().pagination.pageIndex + 1}</strong> {t('recipes.table.of')} {table.getPageCount()}
            </span>
            <Button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              variant="outline"
              size="sm"
            >
              {t('recipes.table.next')}
            </Button>
            <Button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              variant="outline"
              size="sm"
              className="hidden sm:flex"
            >
              {t('recipes.table.last')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
