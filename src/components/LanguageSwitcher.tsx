import { useNavigate, useParams, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const routerState = useRouterState()
  const navigate = useNavigate()
  
  // Get current route path to preserve it when switching languages
  const currentRoute = routerState.location.pathname
  // Remove locale prefix if present
  const pathWithoutLocale = currentRoute.replace(/^\/(en|nl)/, '') || '/'
  
  // Detect current locale from URL
  const pathSegments = currentRoute.split('/').filter(Boolean)
  const currentLocale = (pathSegments[0] === 'nl' || pathSegments[0] === 'en') ? pathSegments[0] : 'en'

  const switchLanguage = (newLocale: string) => {
    // Build new path with locale
    const newPath = newLocale === 'en' ? pathWithoutLocale : `/${newLocale}${pathWithoutLocale}`
    navigate({ to: newPath as any })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => switchLanguage('en')}
        className={`px-3 py-1 text-sm rounded-md transition-colors ${
          currentLocale === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => switchLanguage('nl')}
        className={`px-3 py-1 text-sm rounded-md transition-colors ${
          currentLocale === 'nl'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        NL
      </button>
    </div>
  )
}
