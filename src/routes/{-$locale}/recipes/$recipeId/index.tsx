import { createFileRoute, useNavigate, Link, useParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState, useMemo, useEffect } from 'react'
import { useRecipe, useDeleteRecipe } from '~/hooks/useRecipes'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
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
  
  // Servings multiplier state (default to original servings, meaning no scaling)
  const originalServings = recipe?.servings || 1
  const [servingsMultiplier, setServingsMultiplier] = useState<number>(originalServings)
  
  // Reset multiplier to original servings when recipe changes
  useEffect(() => {
    if (recipe?.servings) {
      setServingsMultiplier(recipe.servings)
    }
  }, [recipe?.servings])
  
  // Calculate multiplier ratio (desired servings / original servings)
  const multiplierRatio = originalServings > 0 ? servingsMultiplier / originalServings : 1
  
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
          <Button asChild variant="ghost" className="mb-4">
            <Link
              to="/{-$locale}/recipes"
              params={{ locale: currentLocale === 'en' ? undefined : currentLocale }}
            >
              ← {t('recipe.backToRecipes')}
            </Link>
          </Button>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-foreground mb-2">{recipe.title}</h1>
              {recipe.description && (
                <p className="text-lg text-muted-foreground mb-4">{recipe.description}</p>
              )}
            </div>
            <div className="flex gap-2 ml-4">
              <Button asChild variant="outline">
                <Link
                  to="/{-$locale}/recipes/$recipeId/edit"
                  params={{ locale: currentLocale === 'en' ? undefined : currentLocale, recipeId }}
                >
                  {t('common.edit')}
                </Link>
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleteRecipe.isPending}
                variant="destructive"
              >
                {deleteRecipe.isPending ? t('recipes.deleting') : t('common.delete')}
              </Button>
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
                        value={servingsMultiplier}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value)
                          if (!isNaN(value) && value > 0) {
                            setServingsMultiplier(value)
                          }
                        }}
                        className="w-20"
                      />
                      {servingsMultiplier !== originalServings && (
                        <span className="text-sm text-muted-foreground">
                          ({t('recipe.originalServings')}: {originalServings})
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <ul className="space-y-2">
                  {scaledIngredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2 text-muted-foreground">•</span>
                      <span className="text-foreground">
                        {ingredient.amount && `${ingredient.amount} `}
                        {ingredient.unit && `${ingredient.unit} `}
                        <strong>{ingredient.name}</strong>
                        {ingredient.notes && ` (${ingredient.notes})`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recipe.instructions && recipe.instructions.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">{t('recipe.instructions')}</h2>
                <ol className="space-y-4">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex">
                      <span className="shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mr-4 text-lg">
                        {instruction.step}
                      </span>
                      <div className="flex-1">
                        <p className="text-foreground">
                          {interpolateIngredients(
                            instruction.instruction,
                            scaledIngredients
                          )}
                        </p>
                      </div>
                    </li>
                  ))}
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
