import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// PostgreSQL Schema
export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  prepTime: integer('prep_time'), // minutes
  cookTime: integer('cook_time'), // minutes
  totalTime: integer('total_time'), // minutes
  servings: integer('servings'),
  servingsRelevant: integer('servings_relevant').default(1), // 1 = relevant, 0 = irrelevant (e.g., for cakes)
  difficulty: text('difficulty'), // 'easy' | 'medium' | 'hard'
  cuisine: text('cuisine'),
  tags: text('tags').array(), // PostgreSQL array
  source: text('source'), // URL or 'uploaded'
  sourceImageUrl: text('source_image_url'), // Original image URL
  imageBlobUrl: text('image_blob_url'), // Main recipe image from Vercel Blob
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  identifier: text('identifier'), // Unique identifier for interpolation (e.g., "eggWhite", "flour")
  amount: text('amount'), // Store as text to handle fractions like "1/2"
  unit: text('unit'),
  notes: text('notes'),
  order: integer('order').default(0),
})

export const instructions = pgTable('instructions', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }),
  step: integer('step').notNull(),
  instruction: text('instruction').notNull(),
  imageUrl: text('image_url'), // Optional step image from Vercel Blob
})

// Relations
export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(ingredients),
  instructions: many(instructions),
}))

export const ingredientsRelations = relations(ingredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [ingredients.recipeId],
    references: [recipes.id],
  }),
}))

export const instructionsRelations = relations(instructions, ({ one }) => ({
  recipe: one(recipes, {
    fields: [instructions.recipeId],
    references: [recipes.id],
  }),
}))

