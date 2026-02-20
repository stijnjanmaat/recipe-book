import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRecipes, getRecipe, createRecipe, updateRecipe, deleteRecipe, extractRecipeFromImageUrl, extractRecipeFromUrlString } from '~/lib/recipes.functions'
import type { CreateRecipeInput, UpdateRecipeInput } from '~/types/recipe'
import { upload } from '@vercel/blob/client';

// Query keys
export const recipeKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipeKeys.all, 'list'] as const,
  list: (filters: string) => [...recipeKeys.lists(), { filters }] as const,
  details: () => [...recipeKeys.all, 'detail'] as const,
  detail: (id: number) => [...recipeKeys.details(), id] as const,
}

// Get all recipes
export function useRecipes() {
  return useQuery({
    queryKey: recipeKeys.lists(),
    queryFn: () => getRecipes({}),
  })
}

// Get single recipe
export function useRecipe(id: number) {
  return useQuery({
    queryKey: recipeKeys.detail(id),
    queryFn: () => getRecipe({ data: { id } }),
    enabled: !!id,
  })
}

// Create recipe mutation
export function useCreateRecipe() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateRecipeInput) => createRecipe({ data }),
    onSuccess: () => {
      // Invalidate and refetch recipes list
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })
    },
  })
}

// Update recipe mutation
export function useUpdateRecipe() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRecipeInput }) => updateRecipe({ data: { id, data } }),
    onSuccess: (_, variables) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(variables.id) })
    },
  })
}

// Delete recipe mutation
export function useDeleteRecipe() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => deleteRecipe({ data: { id } }),
    onSuccess: () => {
      // Invalidate recipes list
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })
    },
  })
}

// Extract recipe from image: client uploads file to Vercel Blob, then we extract from the blob URL (avoids 4.5MB serverless body limit)
export function useExtractRecipeFromImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      imageFile,
      outputLanguage,
      measurementSystem,
    }: {
      imageFile: File
      outputLanguage: string
      measurementSystem: string
    }) => {
      const blob = await upload(`recipe-${Date.now()}-${imageFile.name}`, imageFile, {
        access: 'public',
        handleUploadUrl: '/api/blob/upload',
      })
      return extractRecipeFromImageUrl({
        data: { imageBlobUrl: blob.url, outputLanguage, measurementSystem },
      })
    },
    onSuccess: (recipe) => {
      if (!recipe) return
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })
      queryClient.setQueryData(recipeKeys.detail(recipe.id), recipe)
    },
  })
}

// Extract recipe from URL mutation
export function useExtractRecipeFromUrl() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ url, outputLanguage, measurementSystem }: { url: string; outputLanguage: string; measurementSystem: string }) => 
      extractRecipeFromUrlString({ data: { url, outputLanguage, measurementSystem } }),
    onSuccess: (recipe) => {
      if (!recipe) return
      // Invalidate recipes list and add the new recipe to cache
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })
      queryClient.setQueryData(recipeKeys.detail(recipe.id), recipe)
    },
  })
}
