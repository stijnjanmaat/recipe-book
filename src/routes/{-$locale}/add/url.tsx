import { createFileRoute, Link, useNavigate, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useExtractRecipeFromUrl } from '~/hooks/useRecipes'

export const Route = createFileRoute('/{-$locale}/add/url')({
  component: AddRecipeFromUrl,
})

function AddRecipeFromUrl() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Get locale from URL params (inherited from parent route)
  const allParams = useParams({ strict: false })
  const currentLocale = allParams.locale || 'en'
  const [url, setUrl] = useState('')
  const extractRecipe = useExtractRecipeFromUrl()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      extractRecipe.mutate(url.trim(), {
        onSuccess: (recipe) => {
          if (!recipe) return
          
          // Navigate to recipe detail page with locale
          navigate({ 
            to: '/{-$locale}/recipes/$recipeId', 
            params: { 
              recipeId: recipe.id.toString(),
              locale: currentLocale === 'en' ? undefined : currentLocale
            }
          })
        },
      })
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('addRecipe.fromUrl')}</h1>
            <p className="text-sm text-gray-600">
              {t('addRecipe.urlDescription')}
            </p>
          </div>
          <Link
            to="/{-$locale}/add/image"
            params={{ locale: currentLocale === 'en' ? undefined : currentLocale }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {t('addRecipe.switchToImage')}
          </Link>
        </div>

        {extractRecipe.isError && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{t('common.error')}</h3>
                <div className="mt-2 text-sm text-red-700">
                  {extractRecipe.error instanceof Error ? extractRecipe.error.message : t('addRecipe.errorExtracting')}
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              {t('addRecipe.fromUrl')}
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t('addRecipe.urlPlaceholder')}
              disabled={extractRecipe.isPending}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
            />
          </div>

          {extractRecipe.isPending ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-lg font-medium text-gray-900">{t('addRecipe.extracting')}</p>
                <p className="text-sm text-gray-600">{t('addRecipe.extractingMoment')}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate({ 
                  to: '/{-$locale}', 
                  params: { locale: currentLocale === 'en' ? undefined : currentLocale }
                })}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={!url.trim() || extractRecipe.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {t('addRecipe.extractButton')}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
