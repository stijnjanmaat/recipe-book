/**
 * Server functions for recipes
 * These can be safely imported anywhere (client or server)
 * TanStack Start's build system replaces implementations with RPC stubs in client bundles
 */
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { authMiddleware } from '~/middleware/auth'
import { CreateRecipeSchema, UpdateRecipeSchema } from '~/types/recipe'

// Server-only code is imported inside handlers, not at top level
// This ensures it's not bundled for the client

// Get all recipes
export const getRecipes = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])  
  .handler(async () => {
    const recipeServer = await import('./recipes.server')
    return recipeServer.getAllRecipes()
  })

// Get single recipe
export const getRecipe = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])  
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const recipeServer = await import('./recipes.server')
    const recipe = await recipeServer.getRecipeById(data.id)
    if (!recipe) {
      throw new Error('Recipe not found')
    }
    return recipe
  })

// Create recipe
export const createRecipe = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])  
  .inputValidator(CreateRecipeSchema)
  .handler(async ({ data }) => {
    const recipeServer = await import('./recipes.server')
    return recipeServer.createRecipe(data)
  })

// Update recipe
export const updateRecipe = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])  
  .inputValidator(
    z.object({
      id: z.number(),
      data: UpdateRecipeSchema,
    })
  )
  .handler(async ({ data }) => {
    const recipeServer = await import('./recipes.server')
    const recipe = await recipeServer.updateRecipe(data.id, data.data)
    if (!recipe) {
      throw new Error('Recipe not found')
    }
    return recipe
  })

// Delete recipe
export const deleteRecipe = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const recipeServer = await import('./recipes.server')
    const deleted = await recipeServer.deleteRecipe(data.id)
    if (!deleted) {
      throw new Error('Recipe not found')
    }
    return { success: true }
  })

// Extract recipe from image
export const extractRecipeFromImageFile = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])  
  .inputValidator((data) => {
    if (!(data instanceof FormData)) {
      throw new Error('Expected FormData')
    }
    const imageFile = data.get('image') as File | null
    if (!imageFile) {
      throw new Error('No image file provided')
    }
    if (!imageFile.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }
    return { imageFile }
  })
  .handler(async ({ data }) => {
    const [recipeServer, { extractRecipeFromImage }, { uploadImage }] = await Promise.all([
      import('./recipes.server'),
      import('~/lib/ai/extractor.server'),
      import('~/lib/storage/blob.server'),
    ])
    
    // Upload image to Vercel Blob
    const imageBlobUrl = await uploadImage(data.imageFile, `recipe-${Date.now()}-${data.imageFile.name}`)

    // Extract recipe from image using LLM
    const extractedRecipe = await extractRecipeFromImage(imageBlobUrl)

    // Store recipe in database
    const completeRecipe = await recipeServer.createRecipe({
      ...extractedRecipe,
      source: 'uploaded',
      sourceImageUrl: imageBlobUrl,
      imageBlobUrl: imageBlobUrl,
    })

    return completeRecipe
  })

// Extract recipe from URL
export const extractRecipeFromUrlString = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])  
  .inputValidator(
    z.object({
      url: z.string().url(),
    })
  )
  .handler(async ({ data }) => {
    const [recipeServer, { extractRecipeFromUrl }, { uploadImageFromUrl }] = await Promise.all([
      import('./recipes.server'),
      import('~/lib/ai/extractor.server'),
      import('~/lib/storage/blob.server'),
    ])
    
    // Extract recipe from URL using OpenAI's web_search tool
    const extractedRecipe = await extractRecipeFromUrl(data.url)

    // Try to upload any image from the recipe if available
    let imageBlobUrl: string | undefined
    if (extractedRecipe.imageBlobUrl || extractedRecipe.sourceImageUrl) {
      try {
        const imageUrl = extractedRecipe.imageBlobUrl || extractedRecipe.sourceImageUrl
        if (imageUrl) {
          imageBlobUrl = await uploadImageFromUrl(imageUrl, `recipe-${Date.now()}.jpg`)
        }
      } catch (error) {
        console.warn('Failed to upload recipe image, continuing without it:', error)
      }
    }

    // Store recipe in database
    const completeRecipe = await recipeServer.createRecipe({
      ...extractedRecipe,
      source: data.url,
      sourceImageUrl: extractedRecipe.sourceImageUrl || data.url,
      imageBlobUrl: imageBlobUrl,
    })

    return completeRecipe
  })
