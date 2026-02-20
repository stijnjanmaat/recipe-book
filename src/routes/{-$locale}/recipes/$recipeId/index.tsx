import { createFileRoute, useNavigate, Link, useParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState, useMemo, useEffect, useRef } from 'react'
import { ArrowLeft, Check, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useRecipe, useDeleteRecipe } from '~/hooks/useRecipes'
import { useAuth } from '~/hooks/useAuth'
import { useScreenWakeLock } from '~/hooks/useScreenWakeLock'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Checkbox } from '~/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { cn } from '~/lib/utils'
import { interpolateIngredients } from '~/lib/utils/ingredient-interpolation'
import { scaleIngredients } from '~/lib/utils/scale-ingredients'
import { authMiddleware } from '~/middleware/auth'
import { detectLocaleFromPath, ensureI18nInitialized } from '~/lib/i18n/config'
import { checkClientAuth } from '~/lib/auth/route-protection'

export const Route = createFileRoute('/{-$locale}/recipes/$recipeId/')({
  beforeLoad: async ({ location }) => {
    const locale = detectLocaleFromPath(location.pathname)
    await ensureI18nInitialized(locale)
    await checkClientAuth(locale)
    return { locale }
  },
  server: {
    middleware: [authMiddleware],
  },
  component: RecipeDetail,
})

function RecipeDetail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = Route.useParams()
  const recipeId = params.recipeId
  // Get locale from URL params (inherited from parent route)
  const allParams = useParams({ strict: false })
  const currentLocale = allParams.locale || 'en'
  
  const { data: recipe, isLoading, isError, error } = useRecipe(Number(recipeId))
  const deleteRecipe = useDeleteRecipe()
  const { user } = useAuth()
  const userId = (user as { id?: string } | undefined)?.id ?? ''

  // Servings multiplier state: string so input can be empty while typing
  const originalServings = recipe?.servings || 1
  const [servingsInput, setServingsInput] = useState<string>(() => String(originalServings))
  const lastSyncedRecipeIdRef = useRef<string | null>(null)

  const scaleServingsStorageKey = `recipe-${userId}-scale-servings-${recipeId}`

  // Load scale servings from localStorage when recipe or user changes; otherwise fall back to recipe.servings
  useEffect(() => {
    if (recipeId == null || recipe?.servings == null || lastSyncedRecipeIdRef.current === recipeId) return
    lastSyncedRecipeIdRef.current = recipeId
    if (!userId) {
      setServingsInput(String(recipe.servings))
      return
    }
    try {
      const stored = localStorage.getItem(scaleServingsStorageKey)
      if (stored !== null) {
        setServingsInput(stored)
        return
      }
    } catch {
      // ignore
    }
    setServingsInput(String(recipe.servings))
  }, [recipeId, userId, recipe?.servings, scaleServingsStorageKey])

  // Persist scale servings to localStorage when it changes
  useEffect(() => {
    if (!userId) return
    try {
      localStorage.setItem(scaleServingsStorageKey, servingsInput)
    } catch {
      // ignore
    }
  }, [userId, scaleServingsStorageKey, servingsInput])

  // Effective number for scaling (empty or invalid => use original; min 1)
  const effectiveServings = (() => {
    const n = parseFloat(servingsInput)
    if (servingsInput === '' || isNaN(n)) return originalServings
    return Math.max(1, n)
  })()

  // Calculate multiplier ratio (desired servings / original servings)
  const multiplierRatio = originalServings > 0 ? effectiveServings / originalServings : 1
  
  // Scale ingredients when multiplier changes
  const scaledIngredients = useMemo(() => {
    if (!recipe?.ingredients || multiplierRatio === 1) {
      return (recipe?.ingredients || []).map((ing) => ({
        name: ing.name,
        identifier: ing.identifier || undefined,
        amount: ing.amount || undefined,
        unit: ing.unit || undefined,
        notes: ing.notes || undefined,
        order: ing.order ?? 0,
      }))
    }
    return scaleIngredients(
      recipe.ingredients.map((ing) => ({
        name: ing.name,
        identifier: ing.identifier || undefined,
        amount: ing.amount || undefined,
        unit: ing.unit || undefined,
        notes: ing.notes || undefined,
        order: ing.order ?? 0,
      })),
      multiplierRatio
    )
  }, [recipe?.ingredients, multiplierRatio])

  // Storage keys scoped to logged-in user so each user has their own check state
  const ingredientsStorageKey = `recipe-${userId}-ingredients-checked-${recipeId}`
  const stepsStorageKey = `recipe-${userId}-steps-checked-${recipeId}`

  // Skip the first save after load so we don't overwrite localStorage with empty state on mount
  const skipNextIngredientsSaveRef = useRef(true)
  const skipNextStepsSaveRef = useRef(true)

  // Ingredient checkboxes: persisted per recipe per user in localStorage
  const [checkedIndices, setCheckedIndices] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!userId) return
    skipNextIngredientsSaveRef.current = true
    try {
      const raw = localStorage.getItem(ingredientsStorageKey)
      if (!raw) {
        setCheckedIndices(new Set())
      } else {
        const arr = JSON.parse(raw) as number[]
        setCheckedIndices(new Set(Array.isArray(arr) ? arr : []))
      }
    } catch {
      setCheckedIndices(new Set())
    }
  }, [recipeId, userId, ingredientsStorageKey])

  useEffect(() => {
    if (!userId) return
    if (skipNextIngredientsSaveRef.current) {
      skipNextIngredientsSaveRef.current = false
      return
    }
    try {
      localStorage.setItem(ingredientsStorageKey, JSON.stringify([...checkedIndices]))
    } catch {
      // ignore
    }
  }, [userId, ingredientsStorageKey, checkedIndices])

  const toggleIngredientChecked = (index: number) => {
    setCheckedIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  // Step checkboxes: persisted per recipe per user in localStorage
  const [checkedStepIndices, setCheckedStepIndices] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!userId) return
    skipNextStepsSaveRef.current = true
    try {
      const raw = localStorage.getItem(stepsStorageKey)
      if (!raw) {
        setCheckedStepIndices(new Set())
      } else {
        const arr = JSON.parse(raw) as number[]
        setCheckedStepIndices(new Set(Array.isArray(arr) ? arr : []))
      }
    } catch {
      setCheckedStepIndices(new Set())
    }
  }, [recipeId, userId, stepsStorageKey])

  useEffect(() => {
    if (!userId) return
    if (skipNextStepsSaveRef.current) {
      skipNextStepsSaveRef.current = false
      return
    }
    try {
      localStorage.setItem(stepsStorageKey, JSON.stringify([...checkedStepIndices]))
    } catch {
      // ignore
    }
  }, [userId, stepsStorageKey, checkedStepIndices])

  const toggleStepChecked = (index: number) => {
    setCheckedStepIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  // Keep screen on while viewing recipe (cooking)
  useScreenWakeLock(true)

  const handleDelete = () => {
    if (window.confirm(t('recipes.deleteConfirm', { title: recipe?.title }))) {
      deleteRecipe.mutate(Number(recipeId), {
        onSuccess: () => {
          navigate({ to: '/{-$locale}/recipes', params: { locale: currentLocale === 'en' ? undefined : currentLocale } })
        },
      })
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-8"></div>
          </div>
        </div>
      </div>
    )
  }

  if (isError || !recipe) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertTitle>{t('recipe.error')}</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : t('recipe.notFound')}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button asChild variant="ghost">
              <Link
                to="/{-$locale}/recipes"
                params={{ locale: currentLocale === 'en' ? undefined : currentLocale }}
              >
                ← {t('recipe.backToRecipes')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
            <Link
              to="/{-$locale}/recipes"
              params={{ locale: currentLocale === 'en' ? undefined : currentLocale }}
            >
              <ArrowLeft className="size-4 mr-1.5" />
              {t('recipe.backToRecipes')}
            </Link>
          </Button>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground mb-2 sm:text-4xl wrap-break-word">{recipe.title}</h1>
              {recipe.description && (
                <p className="text-base text-muted-foreground mb-4 sm:text-lg line-clamp-3 sm:line-clamp-none">{recipe.description}</p>
              )}
            </div>
            <div className="flex w-full sm:w-auto items-center justify-end gap-2 shrink-0">
              <Button asChild variant="outline" size="sm" className="sm:flex hidden">
                <Link
                  to="/{-$locale}/recipes/$recipeId/edit"
                  params={{ locale: currentLocale === 'en' ? undefined : currentLocale, recipeId }}
                >
                  <Pencil className="size-4 sm:mr-1.5" />
                  {t('common.edit')}
                </Link>
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleteRecipe.isPending}
                variant="destructive"
                size="sm"
                className="sm:flex hidden"
              >
                <Trash2 className="size-4 sm:mr-1.5" />
                {deleteRecipe.isPending ? t('recipes.deleting') : t('common.delete')}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" className="sm:hidden size-7 p-1 text-muted-foreground hover:text-foreground -mr-1" aria-label={t('recipes.table.actions')}>
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={2} className="min-w-36 w-auto p-0.5">
                  <DropdownMenuItem asChild>
                    <Link
                      to="/{-$locale}/recipes/$recipeId/edit"
                      params={{ locale: currentLocale === 'en' ? undefined : currentLocale, recipeId }}
                    >
                      <Pencil className="size-4 mr-2" />
                      {t('common.edit')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={deleteRecipe.isPending}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="size-4 mr-2" />
                    {deleteRecipe.isPending ? t('recipes.deleting') : t('common.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {recipe.imageBlobUrl && (
          <div className="mb-8">
            <img
              src={recipe.imageBlobUrl}
              alt={recipe.title}
              className="w-full h-auto rounded-lg object-cover max-h-96"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-foreground">{t('recipe.ingredients')}</h2>
                  {recipe.servings && recipe.servingsRelevant !== false && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="servings-multiplier" className="text-sm text-muted-foreground">
                        {t('recipe.scaleTo')}:
                      </Label>
                      <Input
                        id="servings-multiplier"
                        type="number"
                        min="1"
                        max="10000"
                        step="1"
                        value={servingsInput}
                        onChange={(e) => setServingsInput(e.target.value)}
                        className="w-20"
                      />
                      {effectiveServings !== originalServings && (
                        <span className="text-sm text-muted-foreground">
                          ({t('recipe.originalServings')}: {originalServings})
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <ul className="space-y-2">
                  {scaledIngredients.map((ingredient, index) => {
                    const isChecked = checkedIndices.has(index)
                    return (
                      <li key={index} className="flex items-start gap-3">
                        <Checkbox
                          id={`ingredient-${recipeId}-${index}`}
                          checked={isChecked}
                          onCheckedChange={() => toggleIngredientChecked(index)}
                          className="mt-0.5 shrink-0"
                          aria-label={ingredient.name}
                        />
                        <label
                          htmlFor={`ingredient-${recipeId}-${index}`}
                          className={cn(
                            'w-fit cursor-pointer select-none text-foreground transition-colors',
                            isChecked && 'text-muted-foreground line-through decoration-2 decoration-muted-foreground'
                          )}
                        >
                          {ingredient.amount && `${ingredient.amount} `}
                          {ingredient.unit && `${ingredient.unit} `}
                          <strong>{ingredient.name}</strong>
                          {ingredient.notes && ` (${ingredient.notes})`}
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {recipe.instructions && recipe.instructions.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">{t('recipe.instructions')}</h2>
                <ol className="space-y-4">
                  {recipe.instructions.map((instruction, index) => {
                    const isStepChecked = checkedStepIndices.has(index)
                    return (
                      <li key={index} className="flex gap-3 items-start">
                        <button
                          type="button"
                          onClick={() => toggleStepChecked(index)}
                          aria-label={isStepChecked ? `Step ${instruction.step} completed` : `Mark step ${instruction.step} complete`}
                          aria-pressed={isStepChecked}
                          className="shrink-0 w-10 h-10 perspective-[280px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full"
                        >
                          <div
                            className="relative w-full h-full transition-transform duration-300"
                            style={{
                              transform: isStepChecked ? 'rotateY(180deg)' : 'rotateY(0deg)',
                              transformStyle: 'preserve-3d',
                            }}
                          >
                            <span
                              className="absolute inset-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg"
                              style={{ backfaceVisibility: 'hidden' }}
                            >
                              {instruction.step}
                            </span>
                            <span
                              className="absolute inset-0 rounded-full bg-green-600 text-white flex items-center justify-center"
                              style={{
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                              }}
                            >
                              <Check className="size-6" strokeWidth={2.5} />
                            </span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStepChecked(index)}
                          className={cn(
                            'flex-1 text-left cursor-pointer select-none transition-colors',
                            isStepChecked && 'text-muted-foreground line-through decoration-2 decoration-muted-foreground'
                          )}
                        >
                          <p className={cn(isStepChecked ? 'text-muted-foreground' : 'text-foreground')}>
                            {interpolateIngredients(
                              instruction.instruction,
                              scaledIngredients
                            )}
                          </p>
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-4">
            {(recipe.prepTime || recipe.cookTime || recipe.totalTime || (recipe.servings && recipe.servingsRelevant !== false)) && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('recipe.metadata')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recipe.prepTime && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('recipe.prepTime')}:</span>
                      <span className="font-medium">{recipe.prepTime} {t('common.minutes')}</span>
                    </div>
                  )}
                  {recipe.cookTime && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('recipe.cookTime')}:</span>
                      <span className="font-medium">{recipe.cookTime} {t('common.minutes')}</span>
                    </div>
                  )}
                  {recipe.totalTime && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('recipe.totalTime')}:</span>
                      <span className="font-medium">{recipe.totalTime} {t('common.minutes')}</span>
                    </div>
                  )}
                  {recipe.servings && recipe.servingsRelevant !== false && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('recipe.servings')}:</span>
                      <span className="font-medium">{recipe.servings}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {recipe.tags && recipe.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('recipe.tags')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {recipe.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm border-2 border-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {recipe.source && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('recipe.source')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {recipe.source.startsWith('http') ? (
                    <a
                      href={recipe.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline break-all"
                    >
                      {recipe.source}
                    </a>
                  ) : (
                    <p>{recipe.source}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
