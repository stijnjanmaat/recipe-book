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
      cell: ({ row }) => (
        <div className="max-w-md truncate text-sm text-muted-foreground">
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
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link
              to="/{-$locale}/recipes/$recipeId"
              params={{ 
                recipeId: row.original.id.toString(),
                locale: currentLocale === 'en' ? undefined : currentLocale
              }}
            >
              {t('recipes.view')}
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
            {deleteRecipe.isPending ? t('recipes.deleting') : t('common.delete')}
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

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <Input
          type="text"
          placeholder={t('recipes.search')}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length}{' '}
          {table.getFilteredRowModel().rows.length !== 1 ? t('recipes.table.recipes') : t('recipes.table.recipe')}
        </div>
      </div>

      {/* Table */}
      <Card>
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

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                variant="outline"
                size="sm"
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
              >
                {t('recipes.table.last')}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {t('recipes.table.page')}{' '}
              <strong>
                {table.getState().pagination.pageIndex + 1} {t('recipes.table.of')} {table.getPageCount()}
              </strong>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
