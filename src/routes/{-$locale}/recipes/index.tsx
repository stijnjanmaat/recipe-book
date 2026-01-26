import { createFileRoute, Link, useParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { detectLocaleFromPath, ensureI18nInitialized } from '~/lib/i18n/config'
import { RecipeTable } from '~/components/RecipeTable'
import { Button } from '~/components/ui/button'
import { authMiddleware } from '~/middleware/auth'
import { checkClientAuth } from '~/lib/auth/route-protection'

export const Route = createFileRoute('/{-$locale}/recipes/')({
  beforeLoad: async ({ location }) => {
    const locale = detectLocaleFromPath(location.pathname)
    
    // CRITICAL: Set i18n locale synchronously before any components render
    // This ensures SSR and client render with the same language
    await ensureI18nInitialized(locale)
    
    // Client-side auth check (only runs on client)
    await checkClientAuth(locale)
  
    return { locale }
  },
  loader: async ({ location }) => {
    const locale = detectLocaleFromPath(location.pathname)
    await ensureI18nInitialized(locale)
        
    return { locale }
  },
  component: AllRecipesComponent,
  server: {
    middleware: [authMiddleware],
  }
})

function AllRecipesComponent() {
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
        <Button asChild>
          <Link
            to="/{-$locale}/add/image"
            params={{ locale: currentLocale === 'en' ? undefined : currentLocale }}
          >
            {t('nav.addRecipe')}
          </Link>
        </Button>
      </div>
      <RecipeTable />
    </div>
  )
}
