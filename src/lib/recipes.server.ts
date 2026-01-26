/**
 * Server-only recipe database operations
 * This file should only be imported in server functions
 */
import { db } from '~/db/client.server'
import type { z } from 'zod'
import { recipes, ingredients, instructions } from '~/db/schema'
import { eq } from 'drizzle-orm'
import { CreateRecipeSchema, UpdateRecipeSchema } from '~/types/recipe'

export async function getAllRecipes() {
  const recipesList = await db.query.recipes.findMany({
    with: {
      ingredients: { orderBy: (ingredients, { asc }) => [asc(ingredients.order)] },
      instructions: { orderBy: (instructions, { asc }) => [asc(instructions.step)] },
    },
  })
  
  // Convert servingsRelevant from integer (0/1) to boolean
  return recipesList.map(recipe => ({
    ...recipe,
    servingsRelevant: recipe.servingsRelevant === 1,
  }))
}

export async function getRecipeById(recipeId: number) {
  const [recipe] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, recipeId))
    .limit(1)

  if (!recipe) {
    return null
  }

  // Fetch related data
  const recipeIngredients = await db
    .select()
    .from(ingredients)
    .where(eq(ingredients.recipeId, recipeId))

  recipeIngredients.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const recipeInstructions = await db
    .select()
    .from(instructions)
    .where(eq(instructions.recipeId, recipeId))

  recipeInstructions.sort((a, b) => a.step - b.step)

  return {
    ...recipe,
    servingsRelevant: recipe.servingsRelevant === 1,
    ingredients: recipeIngredients,
    instructions: recipeInstructions,
  }
}

export async function createRecipe(data: z.infer<typeof CreateRecipeSchema>) {
  // Insert recipe
  const [newRecipe] = await db
    .insert(recipes)
    .values({
      title: data.title,
      description: data.description,
      prepTime: data.prepTime,
      cookTime: data.cookTime,
      totalTime: data.totalTime,
      servings: data.servings,
      servingsRelevant: data.servingsRelevant !== undefined ? (data.servingsRelevant ? 1 : 0) : undefined,
      difficulty: data.difficulty,
      cuisine: data.cuisine,
      tags: data.tags,
      source: data.source,
      sourceImageUrl: data.sourceImageUrl,
      imageBlobUrl: data.imageBlobUrl,
    })
    .returning()

  const recipeId = newRecipe.id

  // Insert ingredients if provided
  if (data.ingredients && data.ingredients.length > 0) {
      await db.insert(ingredients).values(
        data.ingredients.map((ing) => ({
          recipeId,
          name: ing.name,
          identifier: ing.identifier,
          amount: ing.amount,
          unit: ing.unit,
          notes: ing.notes,
          order: ing.order ?? 0,
        }))
      )
  }

  // Insert instructions if provided
  if (data.instructions && data.instructions.length > 0) {
    await db.insert(instructions).values(
      data.instructions.map((inst) => ({
        recipeId,
        step: inst.step,
        instruction: inst.instruction,
        imageUrl: inst.imageUrl,
      }))
    )
  }

  // Return complete recipe
  return getRecipeById(recipeId)
}

export async function updateRecipe(recipeId: number, data: z.infer<typeof UpdateRecipeSchema>) {
  // Check if recipe exists
  const [existing] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, recipeId))
    .limit(1)

  if (!existing) {
    return null
  }

  // Build update object with only provided fields
  const updateFields: Partial<typeof recipes.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (data.title !== undefined) updateFields.title = data.title
  if (data.description !== undefined) updateFields.description = data.description
  if (data.prepTime !== undefined) updateFields.prepTime = data.prepTime
  if (data.cookTime !== undefined) updateFields.cookTime = data.cookTime
  if (data.totalTime !== undefined) updateFields.totalTime = data.totalTime
  if (data.servings !== undefined) updateFields.servings = data.servings
  if (data.servingsRelevant !== undefined) updateFields.servingsRelevant = data.servingsRelevant ? 1 : 0
  if (data.difficulty !== undefined) updateFields.difficulty = data.difficulty
  if (data.cuisine !== undefined) updateFields.cuisine = data.cuisine
  if (data.tags !== undefined) updateFields.tags = data.tags
  if (data.source !== undefined) updateFields.source = data.source
  if (data.sourceImageUrl !== undefined) updateFields.sourceImageUrl = data.sourceImageUrl
  if (data.imageBlobUrl !== undefined) updateFields.imageBlobUrl = data.imageBlobUrl

  // Update recipe
  await db
    .update(recipes)
    .set(updateFields)
    .where(eq(recipes.id, recipeId))

  // Update ingredients if provided
  if (data.ingredients !== undefined) {
    await db.delete(ingredients).where(eq(ingredients.recipeId, recipeId))
    if (data.ingredients.length > 0) {
      await db.insert(ingredients).values(
        data.ingredients.map((ing) => ({
          recipeId,
          name: ing.name,
          identifier: ing.identifier,
          amount: ing.amount,
          unit: ing.unit,
          notes: ing.notes,
          order: ing.order ?? 0,
        }))
      )
    }
  }

  // Update instructions if provided
  if (data.instructions !== undefined) {
    await db.delete(instructions).where(eq(instructions.recipeId, recipeId))
    if (data.instructions.length > 0) {
      await db.insert(instructions).values(
        data.instructions.map((inst) => ({
          recipeId,
          step: inst.step,
          instruction: inst.instruction,
          imageUrl: inst.imageUrl,
        }))
      )
    }
  }

  return getRecipeById(recipeId)
}

export async function deleteRecipe(recipeId: number) {
  // Check if recipe exists
  const [recipe] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, recipeId))
    .limit(1)

  if (!recipe) {
    return false
  }

  // Delete recipe (cascade will delete related records)
  await db.delete(recipes).where(eq(recipes.id, recipeId))
  return true
}
