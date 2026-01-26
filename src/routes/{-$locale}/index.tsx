import { createFileRoute, Link, useParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { detectLocaleFromPath, ensureI18nInitialized } from '~/lib/i18n/config'
import { Button } from '~/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { useAuth } from '~/hooks/useAuth'

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

export function IndexComponent() {
  const { t } = useTranslation()
  const allParams = useParams({ strict: false })
  const currentLocale = allParams.locale || 'en'
  const { isAuthenticated, isSuperadmin } = useAuth()

  return (
    <div className="px-4 py-12 sm:px-0">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            {t('homepage.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('homepage.subtitle')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>{t('homepage.features.imageExtraction.title')}</CardTitle>
              <CardDescription>
                {t('homepage.features.imageExtraction.description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('homepage.features.urlExtraction.title')}</CardTitle>
              <CardDescription>
                {t('homepage.features.urlExtraction.description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('homepage.features.aiPowered.title')}</CardTitle>
              <CardDescription>
                {t('homepage.features.aiPowered.description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('homepage.features.organized.title')}</CardTitle>
              <CardDescription>
                {t('homepage.features.organized.description')}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          {isAuthenticated && isSuperadmin ? (
            <div className="space-y-4">
              <p className="text-muted-foreground mb-4">
                {t('homepage.cta.loggedIn')}
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild size="lg">
                  <Link
                    to="/{-$locale}/recipes"
                    params={{ locale: currentLocale === 'en' ? undefined : currentLocale }}
                  >
                    {t('homepage.cta.viewRecipes')}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link
                    to="/{-$locale}/add/image"
                    params={{ locale: currentLocale === 'en' ? undefined : currentLocale }}
                  >
                    {t('homepage.cta.addRecipe')}
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground mb-4">
                {t('homepage.cta.loggedOut')}
              </p>
              <Button asChild size="lg">
                <Link
                  to="/{-$locale}/login"
                  params={{ locale: currentLocale === 'en' ? undefined : currentLocale }}
                >
                  {t('homepage.cta.signIn')}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
