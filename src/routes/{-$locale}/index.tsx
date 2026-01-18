import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ensureI18nInitialized } from '~/lib/i18n/config'
import { RecipeTable } from '~/components/RecipeTable'

export const Route = createFileRoute('/{-$locale}/')({
  beforeLoad: async ({ params, location }) => {
    // Detect locale from URL path - check if path starts with /nl/ or /en/
    const pathSegments = location.pathname.split('/').filter(Boolean)
    let locale = 'en' // default
    
    // ALWAYS prioritize URL path over params
    // Check first segment for locale
    if (pathSegments[0] === 'nl') {
      locale = 'nl'
    } else if (pathSegments[0] === 'en') {
      locale = 'en'
    } else {
      // No locale prefix, default to 'en'
      locale = 'en'
    }
    
    // Ensure i18n is initialized
    await ensureI18nInitialized()
    
    // Set i18n language from detected locale
    const i18n = await import('~/lib/i18n/config')
    if (i18n.default.language !== locale) {
      await i18n.default.changeLanguage(locale)
    }
    
    return { locale }
  },
  component: IndexComponent,
})

function IndexComponent() {
  const { t } = useTranslation()
  const localeContext = Route.useRouteContext()
  const currentLocale = localeContext?.locale || 'en'

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
