import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { useState, useEffect } from 'react'
import { ensureI18nInitialized } from '~/lib/i18n/config'
import { authClient } from '~/lib/auth-client'
import { useAuth } from '~/hooks/useAuth'

export const Route = createFileRoute('/{-$locale}/login')({
  beforeLoad: async ({ location }) => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    let locale = 'en'
    if (pathSegments[0] === 'nl') {
      locale = 'nl'
    } else if (pathSegments[0] === 'en') {
      locale = 'en'
    } else {
      locale = 'en'
    }
    await ensureI18nInitialized(locale)
    return { locale }
  },
  component: LoginComponent,
})

function LoginComponent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const allParams = useParams({ strict: false })
  const currentLocale = allParams.locale || 'en'

  // Check if user is already logged in and is superadmin
  const { isAuthenticated, isSuperadmin } = useAuth()

  // Redirect if already logged in as superadmin
  useEffect(() => {
    if (isAuthenticated && isSuperadmin) {
      navigate({
        to: '/{-$locale}/recipes',
        params: { locale: currentLocale === 'en' ? undefined : currentLocale },
        replace: true,
      })
    }
  }, [isAuthenticated, isSuperadmin, navigate, currentLocale])

  const handleGoogleSignIn = async () => {
    setError(null)
    try {
      // Use Better Auth client to sign in with Google
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: `/${currentLocale}/recipes`,
      })
      // The redirect will happen automatically via Better Auth
    } catch (err) {
      console.error('Google sign-in error:', err)
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{t('auth.signIn')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            onClick={handleGoogleSignIn}
            className="w-full"
            size="lg"
          >
            {t('auth.signInWithGoogle')}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            {t('auth.signInHint')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
