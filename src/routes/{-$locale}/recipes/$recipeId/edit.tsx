import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useRecipe, useUpdateRecipe } from '~/hooks/useRecipes'
import { useState, useEffect } from 'react'
import { z } from 'zod'
import { UpdateRecipeSchema } from '~/types/recipe'

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
          <div className="rounded-md bg-red-50 p-4">
            <h3 className="text-sm font-medium text-red-800">{t('editRecipe.errorLoading')}</h3>
            <p className="mt-2 text-sm text-red-700">{t('editRecipe.notFound')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate({ 
              to: '/{-$locale}/recipes/$recipeId', 
              params: { 
                locale: currentLocale === 'en' ? undefined : currentLocale,
                recipeId 
              }
            })}
            className="text-blue-600 hover:text-blue-800 font-medium mb-4 inline-block"
          >
            ← {t('editRecipe.backToRecipe')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{t('editRecipe.title')}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{t('editRecipe.basicInfo')}</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  {t('editRecipe.titleLabel')} *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  {t('editRecipe.descriptionLabel')}
                </label>
                <textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value || undefined })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate({ 
                to: '/{-$locale}/recipes/$recipeId', 
                params: { 
                  locale: currentLocale === 'en' ? undefined : currentLocale,
                  recipeId 
                }
              })}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={updateRecipe.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {updateRecipe.isPending ? t('editRecipe.saving') : t('editRecipe.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
