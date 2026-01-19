import { createFileRoute, useNavigate, Link, useParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useRecipe, useDeleteRecipe } from '~/hooks/useRecipes'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'

export const Route = createFileRoute('/{-$locale}/recipes/$recipeId/')({
  component: RecipeDetail,
})

function RecipeDetail() {
  const { t } = useTranslation()
  const params = Route.useParams()
  const recipeId = params.recipeId
  // Get locale from URL params (inherited from parent route)
  const allParams = useParams({ strict: false })
  const currentLocale = allParams.locale || 'en'
  const navigate = useNavigate()
  const { data: recipe, isLoading, isError, error } = useRecipe(Number(recipeId))
  const deleteRecipe = useDeleteRecipe()

  const handleDelete = () => {
    if (window.confirm(t('recipes.deleteConfirm', { title: recipe?.title }))) {
      deleteRecipe.mutate(Number(recipeId), {
        onSuccess: () => {
          navigate({ to: '/{-$locale}', params: { locale: currentLocale === 'en' ? undefined : currentLocale } })
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
                to="/{-$locale}"
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
              to="/{-$locale}"
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
                <h2 className="text-2xl font-bold text-foreground mb-4">{t('recipe.ingredients')}</h2>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
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
                        <p className="text-foreground">{instruction.instruction}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
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
