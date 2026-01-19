import type { Ingredient } from '~/types/recipe'

/**
 * Replace ingredient placeholders in instruction text with actual amounts and units
 * Placeholders format: {{identifier}} or {{identifier}}
 * Example: "Add {{flour}} to the bowl" -> "Add 2 cups to the bowl"
 */
export function interpolateIngredients(
  instruction: string,
  ingredients: Ingredient[]
): string {
  if (!ingredients || ingredients.length === 0) {
    return instruction
  }

  // Create a map of identifier -> ingredient for quick lookup
  const ingredientMap = new Map<string, Ingredient>()
  ingredients.forEach((ing) => {
    if (ing.identifier) {
      ingredientMap.set(ing.identifier.toLowerCase(), ing)
    }
  })

  // Replace placeholders like {{identifier}} or {{identifier}}
  return instruction.replace(/\{\{(\w+)\}\}/g, (match, identifier) => {
    const ingredient = ingredientMap.get(identifier.toLowerCase())
    if (!ingredient) {
      // If ingredient not found, return the placeholder as-is
      return match
    }

    // Build the replacement string: amount + unit
    const parts: string[] = []
    if (ingredient.amount) {
      parts.push(ingredient.amount)
    }
    if (ingredient.unit) {
      parts.push(ingredient.unit)
    }
    if (ingredient.name) {
      parts.push(ingredient.name.toLowerCase())
    }

    // If we have at least amount or unit, return the combined string
    // Otherwise, return the ingredient name as fallback
    return parts.length > 0 ? parts.join(' ') : ingredient.name
  })
}
