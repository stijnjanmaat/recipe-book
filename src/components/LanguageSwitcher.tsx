import { useNavigate, useParams, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { detectLocaleFromPath } from '~/lib/i18n/config'
import { Button } from '~/components/ui/button'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const routerState = useRouterState()
  const navigate = useNavigate()
  
  // Get current route path to preserve it when switching languages
  const currentRoute = routerState.location.pathname
  // Remove locale prefix if present
  const pathWithoutLocale = currentRoute.replace(/^\/(en|nl)/, '') || '/'
  
  const currentLocale = detectLocaleFromPath(currentRoute)

  const switchLanguage = (newLocale: string) => {
    // Build new path with locale
    const newPath = newLocale === 'en' ? pathWithoutLocale : `/${newLocale}${pathWithoutLocale}`
    navigate({ to: newPath as any })
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => switchLanguage('en')}
        variant={currentLocale === 'en' ? 'default' : 'outline'}
        size="sm"
      >
        EN
      </Button>
      <Button
        onClick={() => switchLanguage('nl')}
        variant={currentLocale === 'nl' ? 'default' : 'outline'}
        size="sm"
      >
        NL
      </Button>
    </div>
  )
}
