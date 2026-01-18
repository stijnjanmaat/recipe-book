import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useRecipes, useDeleteRecipe } from '~/hooks/useRecipes'
import type { Recipe } from '~/types/recipe'

// Type for recipe with database fields and relations
type RecipeWithId = Recipe & {
  id: number
  createdAt: Date | null
  updatedAt: Date | null
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
  const pathSegments = currentRoute.split('/').filter(Boolean)
  const currentLocale = (pathSegments[0] === 'nl' || pathSegments[0] === 'en') ? pathSegments[0] : 'en'
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
              <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs cursor-pointer hover:bg-gray-300 transition-colors">
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
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: 'description',
      header: t('recipes.table.description'),
      cell: ({ row }) => (
        <div className="max-w-md truncate text-sm text-gray-600">
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
        return prepTime ? `${prepTime} min` : '-'
      },
    },
    {
      accessorKey: 'cookTime',
      header: t('recipes.table.cookTime'),
      cell: ({ row }) => {
        const cookTime = row.original.cookTime
        return cookTime ? `${cookTime} min` : '-'
      },
    },
    {
      accessorKey: 'servings',
      header: t('recipes.table.servings'),
      cell: ({ row }) => row.original.servings || '-',
    },
    {
      id: 'actions',
      header: t('recipes.table.actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Link
            to="/recipes/$recipeId"
            params={{ recipeId: row.original.id.toString() }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {t('recipes.view')}
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm(t('recipes.deleteConfirm', { title: row.original.title }))) {
                deleteRecipe.mutate(row.original.id)
              }
            }}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
            disabled={deleteRecipe.isPending}
          >
            {deleteRecipe.isPending ? t('recipes.deleting') : t('common.delete')}
          </button>
        </div>
      ),
      enableSorting: false,
    },
  ]

  const table = useReactTable({
    data: recipes as RecipeWithId[],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">{t('recipes.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{t('recipes.error')}: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder={t('recipes.search')}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="text-sm text-gray-600">
          {table.getFilteredRowModel().rows.length}{' '}
          {table.getFilteredRowModel().rows.length !== 1 ? t('recipes.table.recipes') : t('recipes.table.recipe')}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? 'cursor-pointer select-none hover:text-gray-700'
                              : ''
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {header.column.columnDef.header as string}
                          {{
                            asc: ' ↑',
                            desc: ' ↓',
                          }[header.column.getIsSorted() as string] ?? ''}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                    {t('recipes.noRecipes')}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 cursor-pointer"
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
                      <td
                        key={cell.id}
                        className="px-6 py-4 whitespace-nowrap text-sm"
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
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                {t('recipes.table.first')}
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                {t('recipes.table.previous')}
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                {t('recipes.table.next')}
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                {t('recipes.table.last')}
              </button>
            </div>
            <div className="text-sm text-gray-700">
              {t('recipes.table.page')}{' '}
              <strong>
                {table.getState().pagination.pageIndex + 1} {t('recipes.table.of')} {table.getPageCount()}
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
