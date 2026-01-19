import { createFileRoute, useNavigate, Link, useParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useRecipe, useDeleteRecipe } from '~/hooks/useRecipes'

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
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{t('recipe.error')}</h3>
                <div className="mt-2 text-sm text-red-700">
                  {error instanceof Error ? error.message : t('recipe.notFound')}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/{-$locale}"
              params={{ locale: currentLocale === 'en' ? undefined : currentLocale }}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← {t('recipe.backToRecipes')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            to="/{-$locale}"
            params={{ locale: currentLocale === 'en' ? undefined : currentLocale }}
            className="text-blue-600 hover:text-blue-800 font-medium mb-4 inline-block"
          >
            ← {t('recipe.backToRecipes')}
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
              {recipe.description && (
                <p className="text-lg text-gray-600 mb-4">{recipe.description}</p>
              )}
            </div>
            <div className="flex gap-2 ml-4">
              <Link
                to="/{-$locale}/recipes/$recipeId/edit"
                params={{ locale: currentLocale === 'en' ? undefined : currentLocale, recipeId }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {t('common.edit')}
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleteRecipe.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
              >
                {deleteRecipe.isPending ? t('recipes.deleting') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>

        {recipe.imageBlobUrl && (
          <div className="mb-8">
            <img
              src={recipe.imageBlobUrl}
              alt={recipe.title}
              className="w-full h-auto rounded-lg shadow-lg object-cover max-h-96"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('recipe.ingredients')}</h2>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2 text-gray-500">•</span>
                      <span className="text-gray-700">
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('recipe.instructions')}</h2>
                <ol className="space-y-4">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex">
                      <span className="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mr-4">
                        {instruction.step}
                      </span>
                      <div className="flex-1">
                        <p className="text-gray-700">{instruction.instruction}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            {recipe.source && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('recipe.source')}</h3>
                {recipe.source.startsWith('http') ? (
                  <a
                    href={recipe.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 break-all"
                  >
                    {recipe.source}
                  </a>
                ) : (
                  <p className="text-gray-700">{recipe.source}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
