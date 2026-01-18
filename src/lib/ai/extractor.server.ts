import OpenAI from 'openai'
import { z } from 'zod'
import { RecipeSchema } from '~/types/recipe'
import { imageExtractionPrompt, urlExtractionPrompt } from './prompts'
import { getRecipeJsonSchema } from './schema'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Use GPT-5.2 (latest model) which supports structured outputs and web_search tool
const IMAGE_MODEL = process.env.AI_MODEL || 'gpt-5.2'
const TEXT_MODEL = process.env.AI_MODEL_TEXT || 'gpt-5.2'

type RecipeType = z.infer<typeof RecipeSchema>

/**
 * Extract recipe from an image URL using OpenAI Structured Outputs
 */
export async function extractRecipeFromImage(imageUrl: string): Promise<RecipeType> {
  try {
    const jsonSchema = getRecipeJsonSchema()
    
    const response = await openai.chat.completions.create({
      model: IMAGE_MODEL,
      messages: [
        {
          role: 'system',
          content: imageExtractionPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: 'Extract the recipe information from this image.',
            },
          ],
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: jsonSchema,
      },
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse JSON response (structured outputs should return valid JSON)
    let parsedContent: unknown
    try {
      parsedContent = JSON.parse(content)
    } catch (error) {
      throw new Error('Failed to parse JSON from structured output response')
    }

    // Validate with Zod schema
    const validated = RecipeSchema.parse(parsedContent)
    return validated
  } catch (error) {
    console.error('Error extracting recipe from image:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to extract recipe: ${error.message}`)
    }
    throw new Error('Failed to extract recipe from image')
  }
}

/**
 * Extract recipe from URL using OpenAI's web_search tool via Responses API
 * Reference: https://developers.openai.com/blog/responses-api
 * The Responses API supports web_search tool and structured outputs
 */
export async function extractRecipeFromUrl(url: string): Promise<RecipeType> {
  try {
    const jsonSchema = getRecipeJsonSchema()
    
    // Use Responses API with web_search tool
    // The Responses API uses a different structure than chat.completions
    // Input should be an array of message objects, not XML-like strings
    const response = await openai.responses.create({
      model: TEXT_MODEL,
      input: [
        {
          role: 'system',
          content: urlExtractionPrompt,
        },
        {
          role: 'user',
          content: `Extract the recipe from this URL: ${url}`,
        },
      ],
      tools: [
        {
          type: 'web_search',
        }
      ],
      tool_choice: 'required', // Force the model to use web_search tool
      text: {
        format: {
          type: 'json_schema',
          schema: jsonSchema.schema, // Extract the schema from our wrapper
          name: jsonSchema.name,
          strict: jsonSchema.strict,
        },
      },
      temperature: 0.3,
    })

    // Responses API returns content in response.output_text or response.output array
    // For structured outputs with JSON schema, the text should be in output_text
    let finalContent: string | undefined

    // First, try to get content from output_text (convenience property)
    if (response.output_text) {
      finalContent = response.output_text
    } else if (response.output && Array.isArray(response.output)) {
      // If output_text is not available, iterate through output array
      for (const outputItem of response.output) {
        if (outputItem.type === 'message' && outputItem.content) {
          // Handle different content types in the message
          if (Array.isArray(outputItem.content)) {
            for (const contentItem of outputItem.content) {
              // Check if contentItem has a text property (could be various types)
              if (contentItem && typeof contentItem === 'object' && 'text' in contentItem) {
                const textContent = (contentItem as { text?: string }).text
                if (textContent) {
                  finalContent = textContent
                  break
                }
              }
            }
          } else if (typeof outputItem.content === 'string') {
            finalContent = outputItem.content
            break
          }
        }
      }
    }

    if (!finalContent) {
      console.error('Response structure:', JSON.stringify(response, null, 2))
      throw new Error('No response content from OpenAI Responses API')
    }

    // Parse JSON response (structured outputs should return valid JSON)
    let parsedContent: unknown
    try {
      parsedContent = JSON.parse(finalContent)
    } catch (error) {
      console.error('Failed to parse JSON. Content:', finalContent)
      throw new Error('Failed to parse JSON from structured output response')
    }

    // Validate with Zod schema
    const validated = RecipeSchema.parse(parsedContent)
    return validated
  } catch (error) {
    console.error('Error extracting recipe from URL:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to extract recipe: ${error.message}`)
    }
    throw new Error('Failed to extract recipe from URL')
  }
}
