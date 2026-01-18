/**
 * Prompt templates for recipe extraction from images and URLs
 * Note: Schema is now passed via response_format, so prompts focus on extraction logic
 */

export const imageExtractionPrompt = `You are a recipe extraction expert. Analyze the provided image and extract all visible recipe information. Extract the recipe title, ingredients, instructions, and any other details you can see. If information is missing, you can omit those fields.`

export const urlExtractionPrompt = `You are a recipe extraction expert. Analyze the provided webpage content and extract the main recipe information. Focus on extracting the recipe from the page, ignoring advertisements, comments, and other non-recipe content. Extract the recipe title, ingredients, instructions, and any other details available.`
