import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { detectLocaleFromPath, ensureI18nInitialized } from '~/lib/i18n/config'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'

export const Route = createFileRoute('/{-$locale}/$splat')({
  beforeLoad: async ({ location }) => {
    const locale = detectLocaleFromPath(location.pathname)
    await ensureI18nInitialized(locale)
    return { locale }
  },
  component: NotFoundComponent,
})

function NotFoundComponent() {
  const { t } = useTranslation()
  const params = Route.useParams()
  const locale = params.locale || 'en'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-6xl font-bold text-muted-foreground">404</CardTitle>
          <CardDescription className="text-xl mt-4">
            {t('notFound.title')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            {t('notFound.description')}
          </p>
          <div className="flex gap-2 justify-center">
            <Button asChild>
              <Link
                to="/{-$locale}"
                params={{ locale: locale === 'en' ? undefined : locale }}
              >
                {t('notFound.backToHome')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}