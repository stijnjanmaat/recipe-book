import { createFileRoute, Link, useParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { detectLocaleFromPath, ensureI18nInitialized } from '~/lib/i18n/config'
import { RecipeTable } from '~/components/RecipeTable'

export const Route = createFileRoute('/{-$locale}/')({
  beforeLoad: async ({ location }) => {
    const locale = detectLocaleFromPath(location.pathname)
    
    // CRITICAL: Set i18n locale synchronously before any components render
    // This ensures SSR and client render with the same language
    await ensureI18nInitialized(locale)
    
    return { locale }
  },
  loader: async ({ location }) => {
    const locale = detectLocaleFromPath(location.pathname)
    await ensureI18nInitialized(locale)
    
    return { locale }
  },
  component: IndexComponent,
})

function IndexComponent() {
  const { t } = useTranslation()
  // Get locale from URL params
  const allParams = useParams({ strict: false })
  const currentLocale = allParams.locale || 'en'

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('recipes.title')}</h1>
          <p className="mt-1 text-sm text-gray-600">{t('recipes.description')}</p>
        </div>
        <Link
          to="/{-$locale}/add/image"
          params={{ locale: currentLocale === 'en' ? undefined : currentLocale }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {t('nav.addRecipe')}
        </Link>
      </div>
      <RecipeTable />
    </div>
  )
}
