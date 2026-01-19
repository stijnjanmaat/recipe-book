import { createFileRoute, Link, useNavigate, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useExtractRecipeFromUrl } from '~/hooks/useRecipes'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'

export const Route = createFileRoute('/{-$locale}/add/url')({
  component: AddRecipeFromUrl,
})

function AddRecipeFromUrl() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Get locale from URL params (inherited from parent route)
  const allParams = useParams({ strict: false })
  const currentLocale = allParams.locale || 'en'
  const [url, setUrl] = useState('')
  const extractRecipe = useExtractRecipeFromUrl()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      extractRecipe.mutate(url.trim(), {
        onSuccess: (recipe) => {
          if (!recipe) return
          
          // Navigate to recipe detail page with locale
          navigate({ 
            to: '/{-$locale}/recipes/$recipeId', 
            params: { 
              recipeId: recipe.id.toString(),
              locale: currentLocale === 'en' ? undefined : currentLocale
            }
          })
        },
      })
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('addRecipe.fromUrl')}</h1>
            <p className="text-sm text-gray-600">
              {t('addRecipe.urlDescription')}
            </p>
          </div>
          <Link
            to="/{-$locale}/add/image"
            params={{ locale: currentLocale === 'en' ? undefined : currentLocale }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {t('addRecipe.switchToImage')}
          </Link>
        </div>

        {extractRecipe.isError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>{t('common.error')}</AlertTitle>
            <AlertDescription>
              {extractRecipe.error instanceof Error ? extractRecipe.error.message : t('addRecipe.errorExtracting')}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">
              {t('addRecipe.fromUrl')}
            </Label>
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-lg font-medium">{t('addRecipe.extracting')}</p>
                <p className="text-sm text-muted-foreground">{t('addRecipe.extractingMoment')}</p>
              </div>
            </Card>
          ) : (
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ 
                  to: '/{-$locale}', 
                  params: { locale: currentLocale === 'en' ? undefined : currentLocale }
                })}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={!url.trim() || extractRecipe.isPending}
              >
                {t('addRecipe.extractButton')}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
