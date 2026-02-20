import { z } from "zod";

// Validation schemas
export const IngredientSchema = z.object({
  name: z.string().min(1),
  identifier: z.string().optional(), // Unique identifier for interpolation (e.g., "eggWhite", "flour")
  amount: z.string().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
  order: z.number().int().default(0),
});

export const InstructionSchema = z.object({
  step: z.number().int().positive(),
  instruction: z.string().min(1),
  imageUrl: z
    .string()
    .refine((val) => !val || URL.canParse(val), {
      message: "Invalid URL format",
    })
    .optional(),
});

export const RecipeSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  prepTime: z.number().int().positive().optional(),
  cookTime: z.number().int().positive().optional(),
  totalTime: z.number().int().positive().optional(),
  servings: z.number().int().positive().optional(),
  servingsRelevant: z.boolean().optional().default(true), // Whether servings are relevant for this recipe
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  cuisine: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
  sourceImageUrl: z
    .string()
    .refine((val) => !val || URL.canParse(val), {
      message: "Invalid URL format",
    })
    .optional(),
  imageBlobUrl: z
    .string()
    .refine((val) => !val || URL.canParse(val), {
      message: "Invalid URL format",
    })
    .optional(),
  ingredients: z.array(IngredientSchema).optional(),
  instructions: z.array(InstructionSchema).optional(),
});

export const CreateRecipeSchema = RecipeSchema;
export const UpdateRecipeSchema = RecipeSchema.partial();

// TypeScript types derived from schemas
export type Ingredient = z.infer<typeof IngredientSchema>;
export type Instruction = z.infer<typeof InstructionSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
export type CreateRecipeInput = z.infer<typeof CreateRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof UpdateRecipeSchema>;
