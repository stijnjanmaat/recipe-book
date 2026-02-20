import { useNavigate, useRouterState } from '@tanstack/react-router'
import { detectLocaleFromPath } from '~/lib/i18n/config'
import { cn } from '~/lib/utils'

export function LanguageSwitcher() {
  const routerState = useRouterState()
  const navigate = useNavigate()
  const currentRoute = routerState.location.pathname
  const pathWithoutLocale = currentRoute.replace(/^\/(en|nl)/, '') || '/'
  const currentLocale = detectLocaleFromPath(currentRoute)

  const switchLanguage = (newLocale: string) => {
    const newPath = newLocale === 'en' ? pathWithoutLocale : `/${newLocale}${pathWithoutLocale}`
    navigate({ to: newPath as any })
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex rounded-full border-2 border-border bg-muted/50 p-0.5"
    >
      <button
        type="button"
        onClick={() => switchLanguage('en')}
        aria-pressed={currentLocale === 'en'}
        aria-label="English"
        className={cn(
          'rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200',
          currentLocale === 'en'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => switchLanguage('nl')}
        aria-pressed={currentLocale === 'nl'}
        aria-label="Nederlands"
        className={cn(
          'rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200',
          currentLocale === 'nl'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        NL
      </button>
    </div>
  )
}
