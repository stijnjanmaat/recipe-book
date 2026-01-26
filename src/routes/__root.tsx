import { createRootRoute, HeadContent, Link, Outlet, Scripts, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '~/components/LanguageSwitcher'
import i18n, { detectLocaleFromPath, ensureI18nInitialized } from '~/lib/i18n/config'
import { Button } from '~/components/ui/button'
import { getSession } from '~/lib/auth/functions'
import { useQuery } from '@tanstack/react-query'
import { authClient } from '~/lib/auth-client'
import { useNavigate } from '@tanstack/react-router'
import '../app.css'

const queryClient = new QueryClient()

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    // Detect locale from URL path on root route as well
    // This ensures i18n is set before the root component renders
    const locale = detectLocaleFromPath(location.pathname)
    
    // Ensure i18n is initialized with the correct locale
    // This runs before any components render, preventing hydration mismatches
    await ensureI18nInitialized(locale)
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
      },
      {
        name: 'description',
        content: 'A recipe collection app with AI-powered extraction',
      },
      {
        name: 'theme-color',
        content: '#fab429',
      },
      {
        name: 'apple-mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'default',
      },
      {
        name: 'apple-mobile-web-app-title',
        content: 'Recipe Book',
      },
      {
        name: 'mobile-web-app-capable',
        content: 'yes',
      },
      {
        title: i18n.t('nav.appName'), // This is for the HTML <title> tag, can stay in English
      },
    ],
    links: [
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
      {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        href: '/icon-192.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        href: '/icon-512.png',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  // Get locale from URL path
  const routerState = useRouterState()
  const currentRoute = routerState.location.pathname
  const locale = detectLocaleFromPath(currentRoute)

  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <NavWithSession locale={locale} />
          <div className="min-h-screen bg-background">
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <Outlet />
              <Scripts />
            </main>
            {import.meta.env.DEV && <TanStackRouterDevtools />}
          </div>
        </QueryClientProvider>
      </body>
    </html>
  )
}

function NavWithSession({ locale }: { locale: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // Now we're inside QueryClientProvider, so useQuery will work
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        return await getSession()
      } catch {
        return null
      }
    },
  })

  const handleSignOut = async () => {
    try {
      await authClient.signOut()
      // Invalidate session query to update UI
      await queryClient.invalidateQueries({ queryKey: ['session'] })
      // Redirect to login page
      navigate({
        to: '/{-$locale}/login',
        params: { locale: locale === 'en' ? undefined : locale },
        replace: true,
      })
    } catch (error) {
      console.error('Sign out error:', error)
      // Fallback to page reload if sign out fails
      window.location.href = '/api/auth/sign-out'
    }
  }

  return (
    <nav className="bg-card border-b-2 border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="shrink-0">
              <Link 
                to="/{-$locale}" 
                params={{ locale: locale === 'en' ? undefined : locale }}
                className="text-xl font-bold text-foreground"
              >
                {t('nav.appName')}
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:gap-2">
              <Button asChild variant="ghost">
                <Link
                  to="/{-$locale}"
                  params={{ locale: locale === 'en' ? undefined : locale }}
                >
                  {t('nav.recipes')}
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link
                  to="/{-$locale}/add/image"
                  params={{ locale: locale === 'en' ? undefined : locale }}
                >
                  {t('nav.addRecipe')}
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {session?.user && (
              <Button variant="ghost" onClick={handleSignOut}>
                {t('auth.signOut')}
              </Button>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  )
}
