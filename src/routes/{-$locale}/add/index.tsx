import { createFileRoute, Link, useNavigate, useParams } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDropzone } from 'react-dropzone'
import { useExtractRecipeFromImage, useExtractRecipeFromUrl } from '~/hooks/useRecipes'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Card } from '~/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { authMiddleware } from '~/middleware/auth'
import { detectLocaleFromPath, ensureI18nInitialized } from '~/lib/i18n/config'
import { checkClientAuth } from '~/lib/auth/route-protection'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/{-$locale}/add/')({
  beforeLoad: async ({ location }) => {
    const locale = detectLocaleFromPath(location.pathname)
    await ensureI18nInitialized(locale)
    await checkClientAuth(locale)
    return { locale }
  },
  validateSearch: (search: Record<string, unknown>): { tab?: 'url' | 'image' } => ({
    tab: search.tab === 'image' ? 'image' : 'url',
  }),
  server: {
    middleware: [authMiddleware],
  },
  component: AddRecipePage,
})

type TabId = 'url' | 'image'

function AddRecipePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tab: initialTab } = Route.useSearch()
  const allParams = useParams({ strict: false })
  const currentLocale = allParams.locale || 'en'

  const [activeTab, setActiveTab] = useState<TabId>(initialTab ?? 'url')
  const [extraOptions, setExtraOptions] = useState({
    outputLanguage: 'en',
    measurementSystem: 'metric',
  })

  // Sync tab from URL search when it changes (e.g. back/forward or direct link)
  useEffect(() => {
    setActiveTab(initialTab ?? 'url')
  }, [initialTab])

  const setTab = (tab: TabId) => {
    setActiveTab(tab)
    navigate({
      to: '/{-$locale}/add',
      params: { locale: currentLocale === 'en' ? undefined : currentLocale },
      search: { tab },
      replace: true,
    })
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('nav.addRecipe')}</h1>
          <p className="text-sm text-muted-foreground mb-4">
            {t('addRecipe.fromUrl')} / {t('addRecipe.fromImage')}
          </p>

          {/* Tabs */}
          <div className="inline-flex rounded-full border-2 border-border bg-muted/50 p-0.5">
            <button
              type="button"
              onClick={() => setTab('url')}
              aria-selected={activeTab === 'url'}
              role="tab"
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-all',
                activeTab === 'url'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t('addRecipe.fromUrl')}
            </button>
            <button
              type="button"
              onClick={() => setTab('image')}
              aria-selected={activeTab === 'image'}
              role="tab"
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-all',
                activeTab === 'image'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t('addRecipe.fromImage')}
            </button>
          </div>
        </div>

        {activeTab === 'url' && (
          <AddRecipeFromUrlTab
            currentLocale={currentLocale}
            extraOptions={extraOptions}
            setExtraOptions={setExtraOptions}
            onCancel={() =>
              navigate({
                to: '/{-$locale}/recipes',
                params: { locale: currentLocale === 'en' ? undefined : currentLocale },
              })
            }
          />
        )}
        {activeTab === 'image' && (
          <AddRecipeFromImageTab
            currentLocale={currentLocale}
            extraOptions={extraOptions}
            setExtraOptions={setExtraOptions}
          />
        )}
      </div>
    </div>
  )
}

function AddRecipeFromUrlTab({
  currentLocale,
  extraOptions,
  setExtraOptions,
  onCancel,
}: {
  currentLocale: string
  extraOptions: { outputLanguage: string; measurementSystem: string }
  setExtraOptions: React.Dispatch<React.SetStateAction<{ outputLanguage: string; measurementSystem: string }>>
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const extractRecipe = useExtractRecipeFromUrl()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      extractRecipe.mutate(
        {
          url: url.trim(),
          outputLanguage: extraOptions.outputLanguage,
          measurementSystem: extraOptions.measurementSystem,
        },
        {
          onSuccess: (recipe) => {
            if (!recipe) return
            navigate({
              to: '/{-$locale}/recipes/$recipeId',
              params: {
                recipeId: recipe.id.toString(),
                locale: currentLocale === 'en' ? undefined : currentLocale,
              },
            })
          },
        }
      )
    }
  }

  return (
    <>
      {extractRecipe.isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>
            {extractRecipe.error instanceof Error
              ? extractRecipe.error.message
              : t('addRecipe.errorExtracting')}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="outputLanguage">{t('addRecipe.outputLanguage')}</Label>
            <Select
              value={extraOptions.outputLanguage}
              onValueChange={(value: string) =>
                setExtraOptions((prev) => ({ ...prev, outputLanguage: value }))
              }
              disabled={extractRecipe.isPending}
            >
              <SelectTrigger id="outputLanguage">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t('common.english')}</SelectItem>
                <SelectItem value="nl">{t('common.dutch')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="measurementSystem">{t('addRecipe.measurementSystem')}</Label>
            <Select
              value={extraOptions.measurementSystem}
              onValueChange={(value: string) =>
                setExtraOptions((prev) => ({ ...prev, measurementSystem: value }))
              }
              disabled={extractRecipe.isPending}
            >
              <SelectTrigger id="measurementSystem">
                <SelectValue placeholder="Select measurement system" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">{t('common.metric')}</SelectItem>
                <SelectItem value="imperial">{t('common.imperial')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="url">{t('addRecipe.url')}</Label>
          <Input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t('addRecipe.urlPlaceholder')}
            disabled={extractRecipe.isPending}
            required
          />
        </div>

        {extractRecipe.isPending ? (
          <Card className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
              <p className="text-lg font-medium">{t('addRecipe.extracting')}</p>
              <p className="text-sm text-muted-foreground">{t('addRecipe.extractingMoment')}</p>
            </div>
          </Card>
        ) : (
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!url.trim() || extractRecipe.isPending}>
              {t('addRecipe.extractButton')}
            </Button>
          </div>
        )}
      </form>
    </>
  )
}

function AddRecipeFromImageTab({
  currentLocale,
  extraOptions,
  setExtraOptions,
}: {
  currentLocale: string
  extraOptions: { outputLanguage: string; measurementSystem: string }
  setExtraOptions: React.Dispatch<React.SetStateAction<{ outputLanguage: string; measurementSystem: string }>>
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [preview, setPreview] = useState<string | null>(null)
  const extractRecipe = useExtractRecipeFromImage()

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        const reader = new FileReader()
        reader.onloadend = () => setPreview(reader.result as string)
        reader.readAsDataURL(file)

        extractRecipe.mutate(
          {
            imageFile: file,
            outputLanguage: extraOptions.outputLanguage,
            measurementSystem: extraOptions.measurementSystem,
          },
          {
            onSuccess: (recipe) => {
              if (!recipe) return
              navigate({
                to: '/{-$locale}/recipes/$recipeId',
                params: {
                  recipeId: recipe.id.toString(),
                  locale: currentLocale === 'en' ? undefined : currentLocale,
                },
              })
            },
          }
        )
      }
    },
    [extractRecipe, navigate, currentLocale, extraOptions]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxFiles: 1,
    disabled: extractRecipe.isPending,
  })

  return (
    <>
      {extractRecipe.isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>
            {extractRecipe.error instanceof Error
              ? extractRecipe.error.message
              : t('addRecipe.errorExtracting')}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="image-outputLanguage">{t('addRecipe.outputLanguage')}</Label>
          <Select
            value={extraOptions.outputLanguage}
            onValueChange={(value: string) =>
              setExtraOptions((prev) => ({ ...prev, outputLanguage: value }))
            }
            disabled={extractRecipe.isPending}
          >
            <SelectTrigger id="image-outputLanguage">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t('common.english')}</SelectItem>
              <SelectItem value="nl">{t('common.dutch')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="image-measurementSystem">{t('addRecipe.measurementSystem')}</Label>
          <Select
            value={extraOptions.measurementSystem}
            onValueChange={(value: string) =>
              setExtraOptions((prev) => ({ ...prev, measurementSystem: value }))
            }
            disabled={extractRecipe.isPending}
          >
            <SelectTrigger id="image-measurementSystem">
              <SelectValue placeholder="Select measurement system" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="metric">{t('common.metric')}</SelectItem>
              <SelectItem value="imperial">{t('common.imperial')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {extractRecipe.isPending ? (
        <Card className="border-2 border-dashed p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
            <p className="text-lg font-medium">{t('addRecipe.extracting')}</p>
            <p className="text-sm text-muted-foreground">{t('addRecipe.extractingMoment')}</p>
          </div>
        </Card>
      ) : (
        <Card
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed p-12 text-center cursor-pointer transition-colors',
            isDragActive ? 'border-primary bg-accent' : 'hover:border-primary/50'
          )}
        >
          <input {...getInputProps()} />
          {preview ? (
            <div className="space-y-4">
              <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
              <p className="text-sm text-muted-foreground">{t('addRecipe.imageReplace')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <svg
                className="mx-auto h-12 w-12 text-muted-foreground"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-lg font-medium">
                {isDragActive ? t('addRecipe.dragActive') : t('addRecipe.dragDrop')}
              </p>
              <p className="text-xs text-muted-foreground">{t('addRecipe.imageHint')}</p>
              <p className="text-xs text-muted-foreground">{t('addRecipe.imageFormats')}</p>
            </div>
          )}
        </Card>
      )}
    </>
  )
}
