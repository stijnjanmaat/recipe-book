/**
 * Convert Zod schema to JSON Schema for OpenAI Structured Outputs
 * OpenAI's strict mode requires ALL properties to be in the required array,
 * even if they're optional in the original schema.
 */
import { RecipeSchema } from "~/types/recipe";

/**
 * Convert RecipeSchema to JSON Schema format for OpenAI
 * OpenAI Structured Outputs with strict: true requires:
 * - ALL properties must be listed in required array (even optional ones)
 * - This is a quirk of OpenAI's strict mode validation
 */
export function getRecipeJsonSchema() {
  // Use Zod 4's built-in JSON Schema conversion
  const jsonSchema = RecipeSchema.toJSONSchema({
    target: "openApi3",
    unrepresentable: "any",
  }) as Record<string, unknown>;

  // Fix the schema to comply with OpenAI's strict mode requirements
  // In strict mode, ALL properties must be in the required array
  const fixedSchema = fixSchemaForStrictMode(jsonSchema);

  // OpenAI expects the schema in this format:
  // {
  //   name: string,
  //   strict: boolean,
  //   schema: JSONSchema object
  // }
  return {
    name: "recipe_extraction",
    strict: true,
    schema: fixedSchema,
  };
}

/**
 * Recursively fix schema to ensure all properties are in required array
 * OpenAI's strict mode requires ALL properties to be in required, even optional ones
 */
function fixSchemaForStrictMode(
  schema: Record<string, unknown>
): Record<string, unknown> {
  const fixed = { ...schema };

  // If this is an object schema with properties
  if (
    fixed.type === "object" &&
    fixed.properties &&
    typeof fixed.properties === "object"
  ) {
    const properties = fixed.properties as Record<string, unknown>;
    const propertyKeys = Object.keys(properties);

    // In strict mode, ALL properties must be in required array
    fixed.required = propertyKeys;

    // Recursively fix nested schemas
    for (const key of propertyKeys) {
      const prop = properties[key];
      if (prop && typeof prop === "object" && !Array.isArray(prop)) {
        properties[key] = fixSchemaForStrictMode(
          prop as Record<string, unknown>
        );
      }
    }
  }

  // If this is an array schema, fix the items schema
  if (
    fixed.type === "array" &&
    fixed.items &&
    typeof fixed.items === "object"
  ) {
    fixed.items = fixSchemaForStrictMode(
      fixed.items as Record<string, unknown>
    );
  }

  return fixed;
}
