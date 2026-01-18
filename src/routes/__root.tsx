import { createRootRoute, HeadContent, Link, Outlet, Scripts, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '~/components/LanguageSwitcher'
import '../app.css'

const queryClient = new QueryClient()

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Recipe Book',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  const { t } = useTranslation()
  // Get locale from URL path
  const routerState = useRouterState()
  const currentRoute = routerState.location.pathname
  const pathSegments = currentRoute.split('/').filter(Boolean)
  const locale = (pathSegments[0] === 'nl' || pathSegments[0] === 'en') ? pathSegments[0] : 'en'

  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between h-16">
                    <div className="flex">
                      <div className="shrink-0 flex items-center">
                        <Link 
                          to="/{-$locale}/" 
                          params={{ locale: locale === 'en' ? undefined : locale }}
                          className="text-xl font-bold text-gray-900"
                        >
                          Recipe Book
                        </Link>
                      </div>
                      <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                        <Link
                          to="/{-$locale}/"
                          params={{ locale: locale === 'en' ? undefined : locale }}
                          className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                        >
                          {t('nav.recipes')}
                        </Link>
                        <Link
                          to="/{-$locale}/add/image"
                          params={{ locale: locale === 'en' ? undefined : locale }}
                          className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                        >
                          {t('nav.addRecipe')}
                        </Link>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <LanguageSwitcher />
                    </div>
                  </div>
              </div>
            </nav>
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
