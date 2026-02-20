import type { Ingredient } from "~/types/recipe";

/**
 * Parse a fraction string (e.g., "1/2", "2 1/2", "3/4") to a decimal number
 */
function parseFraction(amount: string): number {
  // Remove extra whitespace
  amount = amount.trim();

  // Handle mixed numbers like "2 1/2"
  const mixedMatch = amount.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseFloat(mixedMatch[1]);
    const numerator = parseFloat(mixedMatch[2]);
    const denominator = parseFloat(mixedMatch[3]);
    return whole + numerator / denominator;
  }

  // Handle simple fractions like "1/2" or "3/4"
  const fractionMatch = amount.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = parseFloat(fractionMatch[1]);
    const denominator = parseFloat(fractionMatch[2]);
    return numerator / denominator;
  }

  // Handle decimals like "1.5" or "2.25"
  const decimal = parseFloat(amount);
  if (!isNaN(decimal)) {
    return decimal;
  }

  // If we can't parse it, return 0
  return 0;
}

/**
 * Format a decimal number as a nice fraction or decimal string
 */
function formatAmount(value: number): string {
  // Round to 4 decimal places to avoid floating point issues
  const rounded = Math.round(value * 10000) / 10000;

  // If it's a whole number, return as integer string
  if (rounded % 1 === 0) {
    return rounded.toString();
  }

  // Try to convert to a simple fraction
  const tolerance = 0.0001;
  const denominators = [2, 3, 4, 5, 6, 8, 16];

  for (const denom of denominators) {
    const numerator = Math.round(rounded * denom);
    const fraction = numerator / denom;
    if (Math.abs(rounded - fraction) < tolerance) {
      // Check if it's a mixed number
      if (numerator >= denom) {
        const whole = Math.floor(numerator / denom);
        const remainder = numerator % denom;
        if (remainder === 0) {
          return whole.toString();
        }
        return `${whole} ${remainder}/${denom}`;
      }
      return `${numerator}/${denom}`;
    }
  }

  // If no nice fraction found, return as decimal with up to 2 decimal places
  return rounded.toFixed(2).replace(/\.?0+$/, "");
}

/**
 * Scale an ingredient amount by a multiplier
 * Handles fractions, decimals, and mixed numbers
 */
export function scaleIngredientAmount(
  amount: string | null | undefined,
  multiplier: number
): string | undefined {
  if (!amount) return undefined;

  const parsed = parseFraction(amount);
  // If we couldn't parse it (and it's not actually "0"), return original
  // This handles cases like "a pinch", "to taste", etc.
  if (parsed === 0 && amount.trim() !== "0" && !amount.match(/^0+$/)) {
    return amount;
  }

  const scaled = parsed * multiplier;
  return formatAmount(scaled);
}

/**
 * Scale all ingredient amounts by a multiplier
 */
export function scaleIngredients(
  ingredients: Array<Ingredient>,
  multiplier: number
): Array<Ingredient> {
  return ingredients.map((ing) => ({
    ...ing,
    amount: scaleIngredientAmount(ing.amount, multiplier),
  }));
}
