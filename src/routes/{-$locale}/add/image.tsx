import { createFileRoute, Link, useNavigate, useParams } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDropzone } from 'react-dropzone'
import { useExtractRecipeFromImage } from '~/hooks/useRecipes'

export const Route = createFileRoute('/{-$locale}/add/image')({
  component: AddRecipeFromImage,
})

function AddRecipeFromImage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Get locale from URL params (inherited from parent route)
  const allParams = useParams({ strict: false })
  const currentLocale = allParams.locale || 'en'
  const [preview, setPreview] = useState<string | null>(null)
  const extractRecipe = useExtractRecipeFromImage()

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreview(reader.result as string)
        }
        reader.readAsDataURL(file)

        // Extract recipe
        extractRecipe.mutate(file, {
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
    },
    [extractRecipe, navigate, currentLocale]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxFiles: 1,
    disabled: extractRecipe.isPending,
  })

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('addRecipe.fromImage')}</h1>
            <p className="text-sm text-gray-600">
              {t('addRecipe.imageDescription')}
            </p>
          </div>
          <Link
            to="/{-$locale}/add/url"
            params={{ locale: currentLocale === 'en' ? undefined : currentLocale }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {t('addRecipe.switchToUrl')}
          </Link>
        </div>

        {extractRecipe.isError && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{t('common.error')}</h3>
                <div className="mt-2 text-sm text-red-700">
                  {extractRecipe.error instanceof Error ? extractRecipe.error.message : t('addRecipe.errorExtracting')}
                </div>
              </div>
            </div>
          </div>
        )}

        {extractRecipe.isPending ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-lg font-medium text-gray-900">{t('addRecipe.extracting')}</p>
              <p className="text-sm text-gray-600">{t('addRecipe.extractingMoment')}</p>
            </div>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
          >
            <input {...getInputProps()} />
            {preview ? (
              <div className="space-y-4">
                <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-md" />
                <p className="text-sm text-gray-600">{t('addRecipe.imageReplace')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {isDragActive ? t('addRecipe.dragActive') : t('addRecipe.dragDrop')}
                  </p>
                </div>
                <p className="text-xs text-gray-500">{t('addRecipe.imageHint')}</p>
                <p className="text-xs text-gray-500">{t('addRecipe.imageFormats')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
