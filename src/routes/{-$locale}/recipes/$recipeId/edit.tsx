import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useRecipe, useUpdateRecipe } from '~/hooks/useRecipes'
import { useState, useEffect } from 'react'
import { z } from 'zod'
import { UpdateRecipeSchema } from '~/types/recipe'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Label } from '~/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Alert, AlertDescription } from '~/components/ui/alert'

export const Route = createFileRoute('/{-$locale}/recipes/$recipeId/edit')({
  component: EditRecipe,
})

function EditRecipe() {
  const { t } = useTranslation()
  const params = Route.useParams()
  const recipeId = params.recipeId
  // Get locale from URL params (inherited from parent route)
  const allParams = useParams({ strict: false })
  const currentLocale = allParams.locale || 'en'
  const navigate = useNavigate()
  const { data: recipe, isLoading, isError } = useRecipe(Number(recipeId))
  const updateRecipe = useUpdateRecipe()

  const [formData, setFormData] = useState<z.infer<typeof UpdateRecipeSchema> | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (recipe) {
      setFormData({
        title: recipe.title || '',
        description: recipe.description || undefined,
        prepTime: recipe.prepTime || undefined,
        cookTime: recipe.cookTime || undefined,
        totalTime: recipe.totalTime || undefined,
        servings: recipe.servings || undefined,
        difficulty: (recipe.difficulty as 'easy' | 'medium' | 'hard' | undefined) || undefined,
        cuisine: recipe.cuisine || undefined,
        tags: recipe.tags || undefined,
        source: recipe.source || undefined,
        ingredients: recipe.ingredients?.map((ing) => ({
          name: ing.name,
          amount: ing.amount || undefined,
          unit: ing.unit || undefined,
          notes: ing.notes || undefined,
          order: ing.order ?? 0,
        })) || [],
        instructions: recipe.instructions?.map((inst) => ({
          step: inst.step,
          instruction: inst.instruction,
          imageUrl: inst.imageUrl || undefined,
        })) || [],
      })
    }
  }, [recipe])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    try {
      const validation = UpdateRecipeSchema.safeParse(formData)
      if (!validation.success) {
        const fieldErrors: Record<string, string> = {}
        validation.error.issues.forEach((err) => {
          if (err.path.length > 0) {
            fieldErrors[err.path.join('.')] = err.message
          }
        })
        setErrors(fieldErrors)
        return
      }

      setErrors({})

      updateRecipe.mutate(
        { id: Number(recipeId), data: formData },
        {
          onSuccess: () => {
            navigate({ 
              to: '/{-$locale}/recipes/$recipeId', 
              params: { 
                locale: currentLocale === 'en' ? undefined : currentLocale,
                recipeId 
              }
            })
          },
          onError: (error) => {
            setErrors({ submit: error.message || t('editRecipe.submitError') })
          },
        }
      )
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.issues.forEach((err) => {
          if (err.path.length > 0) {
            fieldErrors[err.path.join('.')] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        setErrors({ submit: t('common.unexpectedError') })
      }
    }
  }

  if (isLoading || !recipe || !formData) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>
              <p className="font-medium">{t('editRecipe.errorLoading')}</p>
              <p className="mt-2">{t('editRecipe.notFound')}</p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate({ 
              to: '/{-$locale}/recipes/$recipeId', 
              params: { 
                locale: currentLocale === 'en' ? undefined : currentLocale,
                recipeId 
              }
            })}
            className="mb-4"
          >
            ← {t('editRecipe.backToRecipe')}
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{t('editRecipe.title')}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('editRecipe.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  {t('editRecipe.titleLabel')} *
                </Label>
                <Input
                  type="text"
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  {t('editRecipe.descriptionLabel')}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value || undefined })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {errors.submit && (
            <Alert variant="destructive">
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ 
                to: '/{-$locale}/recipes/$recipeId', 
                params: { 
                  locale: currentLocale === 'en' ? undefined : currentLocale,
                  recipeId 
                }
              })}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={updateRecipe.isPending}
            >
              {updateRecipe.isPending ? t('editRecipe.saving') : t('editRecipe.saveChanges')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
