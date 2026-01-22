# Recipe Book Application - Implementation Plan

## Overview
A TypeScript application using TanStack (React Query/Table) that collects recipes via LLM processing of images, photos, screenshots, and URLs. Recipes are stored in a structured backend database.

## Architecture

### High-Level Architecture
```
┌─────────────────┐
│   Frontend      │
│ (TanStack Start)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Server Routes  │
│ (TanStack Start │
│  + Vercel AI    │
│     SDK)        │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│   LLM  │ │ Database │
│ (OpenAI│ │ (Postgres│
│  API)  │ │ /SQLite) │
└────────┘ └──────────┘
         │
         ▼
┌─────────────────┐
│  Vercel Blob    │
│  (Image Storage)│
└─────────────────┘
```

## Tech Stack

### Frontend & Framework
- **Framework**: TanStack Start (full-stack TypeScript framework with TanStack Router + Vite)
- **UI Library**: TanStack Table (for recipe display/management)
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS + shadcn/ui components
- **File Upload**: React Dropzone or similar
- **Image Processing**: Client-side image preview/optimization

### Backend
- **Runtime**: TanStack Start server functions/RPCs
- **AI Integration**: Vercel AI SDK
- **LLM Provider**: OpenAI (GPT-4 Vision) via API key
- **Database**: 
  - **Production**: PostgreSQL via Vercel Postgres
  - **Development**: SQLite (local file-based)
- **ORM**: Drizzle ORM (supports both Postgres and SQLite)
- **Image Storage**: Vercel Blob Storage

### MCP Server Consideration
**Decision: Not Using MCP Server**

We will not implement an MCP (Model Context Protocol) server for this application. The LLM will process inputs (images/URLs) and return structured JSON, which our server functions will then store in the database. This approach is simpler and sufficient for the recipe extraction use case.

If needed in the future, an MCP server could be added to enable the LLM to query existing recipes, modify recipes during extraction, or perform complex multi-step operations.

## Project Structure

```
recipe-book/
├── src/
│   ├── routes/
│   │   ├── index.tsx                # Home page with recipe list
│   │   ├── recipes/
│   │   │   ├── index.tsx           # Recipe list page
│   │   │   └── $recipeId.tsx       # Recipe detail page
│   │   └── add/
│   │       ├── image.tsx           # Add recipe via image upload
│   │       └── url.tsx             # Add recipe via URL
│   ├── api/
│   │   ├── recipes/
│   │   │   ├── index.ts            # GET/POST recipes (server function)
│   │   │   └── $recipeId.ts        # GET/PUT/DELETE single recipe
│   │   ├── extract/
│   │   │   ├── image.ts            # Extract recipe from image (server function)
│   │   │   └── url.ts              # Extract recipe from URL (server function)
│   │   └── upload/
│   │       └── blob.ts              # Handle image uploads to Vercel Blob
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── recipe/
│   │   │   ├── RecipeCard.tsx
│   │   │   ├── RecipeForm.tsx
│   │   │   ├── RecipeTable.tsx     # TanStack Table
│   │   │   └── RecipeDetail.tsx
│   │   ├── upload/
│   │   │   ├── ImageUpload.tsx
│   │   │   └── URLInput.tsx
│   │   └── extraction/
│   │       └── ExtractionStatus.tsx
│   ├── db/
│   │   ├── schema.ts                # Database schema (Drizzle)
│   │   ├── client.ts                # DB connection (Postgres/SQLite)
│   │   ├── migrations/
│   │   └── seed.ts                  # Optional seed data
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── extractor.ts         # LLM extraction logic
│   │   │   └── prompts.ts           # Prompt templates
│   │   ├── storage/
│   │   │   └── blob.ts              # Vercel Blob wrapper
│   │   ├── utils.ts
│   │   └── validations.ts           # Zod schemas
│   ├── types/
│   │   └── recipe.ts                # TypeScript types
│   └── hooks/
│       └── useRecipes.ts            # TanStack Query hooks
├── drizzle.config.ts
├── app.config.ts                    # TanStack Start config
├── vite.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── .env.example
```

## Database Schema (Drizzle ORM)

### Recipe Table
```typescript
// Using Drizzle schema definition
import { pgTable, sqliteTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// For PostgreSQL (production)
export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  prepTime: integer('prep_time'), // minutes
  cookTime: integer('cook_time'), // minutes
  totalTime: integer('total_time'), // minutes
  servings: integer('servings'),
  difficulty: text('difficulty'), // 'easy' | 'medium' | 'hard'
  cuisine: text('cuisine'),
  tags: text('tags').array(), // PostgreSQL array
  source: text('source'), // URL or 'uploaded'
  sourceImageUrl: text('source_image_url'), // Vercel Blob URL
  imageBlobUrl: text('image_blob_url'), // Main recipe image from Vercel Blob
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// For SQLite (development) - similar structure but without array support
export const recipesSqlite = sqliteTable('recipes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  prepTime: integer('prep_time'),
  cookTime: integer('cook_time'),
  totalTime: integer('total_time'),
  servings: integer('servings'),
  difficulty: text('difficulty'),
  cuisine: text('cuisine'),
  tags: text('tags'), // JSON string in SQLite
  source: text('source'),
  sourceImageUrl: text('source_image_url'),
  imageBlobUrl: text('image_blob_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
```

### Ingredient Table
```typescript
export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  amount: text('amount'), // Store as text to handle fractions like "1/2"
  unit: text('unit'),
  notes: text('notes'),
  order: integer('order').default(0),
});
```

### Instruction Table
```typescript
export const instructions = pgTable('instructions', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }),
  step: integer('step').notNull(),
  instruction: text('instruction').notNull(),
  imageUrl: text('image_url'), // Optional step image from Vercel Blob
});
```

### Nutrition Table (Optional)
```typescript
export const nutrition = pgTable('nutrition', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }),
  calories: integer('calories'),
  protein: integer('protein'), // grams
  carbs: integer('carbs'), // grams
  fat: integer('fat'), // grams
  fiber: integer('fiber'), // grams
  sugar: integer('sugar'), // grams
  sodium: integer('sodium'), // mg
});
```

**Note**: Drizzle supports conditional table definitions based on environment. You can create a factory function that returns the appropriate table definition based on whether you're using Postgres or SQLite.

## Core Features

### 1. Recipe Extraction from Images
- **Input**: User uploads image (photo, screenshot)
- **Process**:
  1. Upload image to blob storage
  2. Send image to LLM (GPT-4 Vision or Claude)
  3. LLM extracts structured recipe data
  4. Validate and store in database
- **LLM Prompt**: Structured prompt requesting JSON output matching recipe schema

### 2. Recipe Extraction from URLs
- **Input**: User provides URL
- **Process**:
  1. Fetch webpage content (with Puppeteer or similar for JS-rendered content)
  2. Extract text/images from page
  3. Send to LLM for recipe extraction
  4. Validate and store in database
- **LLM Prompt**: Extract recipe from webpage content

### 3. Recipe Management
- **View**: List recipes in table (TanStack Table)
- **Search/Filter**: By title, cuisine, tags, difficulty
- **Edit**: Manual editing of extracted recipes
- **Delete**: Remove recipes
- **Export**: Export recipes (JSON, PDF, etc.)

### 4. Recipe Display
- **Detail View**: Full recipe with ingredients, instructions, images
- **Print View**: Print-friendly format
- **Share**: Shareable links

## Implementation Steps

### Phase 1: Project Setup
1. Initialize TanStack Start project with TypeScript
   ```bash
   npm create tanstack-start@latest recipe-book
   ```
2. Install dependencies:
   - `@tanstack/react-query` (for data fetching)
   - `@tanstack/react-table` (for recipe table)
   - `ai` (Vercel AI SDK)
   - `drizzle-orm` + `drizzle-kit` (for migrations)
   - `@vercel/postgres` (for Postgres in production)
   - `better-sqlite3` (for SQLite in development)
   - `@vercel/blob` (for image storage)
   - `openai` (OpenAI SDK)
   - `zod` (for validation)
   - `tailwindcss` + `shadcn/ui`
   - `react-dropzone` (for file uploads)
3. Set up database configuration:
   - Create `src/db/client.ts` with conditional Postgres/SQLite connection
   - Configure Drizzle to use appropriate driver based on environment
4. Configure environment variables (see Environment Variables section)

### Phase 2: Database Setup
1. Define database schema with Drizzle
2. Create migrations
3. Set up database connection
4. Create seed data (optional)

### Phase 3: Core API Routes (TanStack Start Server Functions)
1. **Recipe CRUD API** (`src/api/recipes/`)
   - `index.ts`: Server function for GET (list) and POST (create)
   - `$recipeId.ts`: Server function for GET (detail), PUT (update), DELETE
   - Use TanStack Start's server function pattern with proper typing

2. **Image Extraction API** (`src/api/extract/image.ts`)
   - Accept image upload (multipart/form-data)
   - Upload image to Vercel Blob storage
   - Get blob URL
   - Call OpenAI API with image URL (GPT-4 Vision)
   - Parse and validate JSON response with Zod
   - Store recipe in database via Drizzle
   - Return recipe data

3. **URL Extraction API** (`src/api/extract/url.ts`)
   - Accept URL in request body
   - Fetch webpage content (handle both static and JS-rendered pages)
   - Extract relevant content (text, images)
   - Call OpenAI API with extracted content
   - Parse and validate JSON response with Zod
   - Store recipe in database via Drizzle
   - Return recipe data

### Phase 4: LLM Integration
1. Set up OpenAI API client with API key from environment variables
2. Create prompt templates in `src/lib/ai/prompts.ts`:
   - Image extraction prompt (for GPT-4 Vision)
   - URL extraction prompt
3. Implement extraction functions in `src/lib/ai/extractor.ts`:
   - Use OpenAI's structured output (JSON mode) when available
   - For images: Use GPT-4 Vision model with image URL from Vercel Blob
   - For URLs: Use GPT-4 or GPT-4 Turbo with extracted text content
4. Add error handling and retry logic (exponential backoff)
5. Validate responses with Zod schemas matching database schema
6. Implement streaming (optional, for better UX during extraction)

### Phase 5: Frontend - Recipe List
1. Create TanStack Query hooks in `src/hooks/useRecipes.ts`:
   - `useRecipes()` - list recipes
   - `useRecipe(id)` - single recipe
   - `useCreateRecipe()` - create recipe
   - `useUpdateRecipe()` - update recipe
   - `useDeleteRecipe()` - delete recipe
2. Build recipe table component with TanStack Table in `src/components/recipe/RecipeTable.tsx`
3. Add search and filter functionality (by title, cuisine, difficulty, tags)
4. Implement pagination with TanStack Table
5. Add loading states (skeletons) and error states
6. Use TanStack Start's route loader for SSR data fetching

### Phase 6: Frontend - Add Recipe
1. Create routes in `src/routes/add/`:
   - `image.tsx` - Image upload page
   - `url.tsx` - URL input page
2. Implement image upload component with react-dropzone:
   - Drag & drop support
   - Image preview before upload
   - Progress indicator
3. Add extraction status indicator:
   - Loading state during LLM processing
   - Success state with extracted recipe preview
   - Error state with retry option
4. Show extracted recipe for review before saving:
   - Display in editable form
   - Allow manual corrections
5. Use TanStack Start server functions for extraction API calls

### Phase 7: Frontend - Recipe Detail
1. ✅ Create recipe detail page
2. ✅ Display all recipe information
3. ⏳ Add edit functionality (edit page)
4. ✅ Add delete functionality
5. ⏳ Implement print view
6. ⏳ **Image handling**: Recipe detail page should show the most relevant image from the website (not the uploaded image), prioritize `sourceImageUrl` or extracted image from webpage

### Phase 8: Polish & Enhancements
1. ✅ **Table improvements**: Ensure image is in first column (already done, verify)
2. ✅ **Fix URL extraction**: Correctly configure OpenAI web_search tool usage
3. ⏳ Add image optimization
4. ⏳ Implement recipe search
5. ⏳ Add tags/categories management
6. ✅ Add export functionality
7. ⏳ Improve error handling
8. ✅ Add loading states and skeletons
9. ✅ Responsive design
10. ⏳ Accessibility improvements
11. ✅ Print view for recipes
12. ✅ Edit recipe functionality with add/remove items

### Phase 9: Internationalization (i18n)
1. ⏳ Set up i18n framework (e.g., react-i18next, next-intl, or similar)
2. ⏳ Add Dutch language support
3. ⏳ Extract all UI text to translation files
4. ⏳ Add language switcher UI
5. ⏳ Test all pages with Dutch translations

### Phase 10: Component Library Migration (shadcn/ui)
1. ⏳ Install and configure shadcn/ui
2. ⏳ Set up theme configuration
3. ⏳ Reimagine RecipeTable component using shadcn components
4. ⏳ Reimagine form components (edit page, add recipe pages)
5. ⏳ Reimagine button components
6. ⏳ Reimagine input components
7. ⏳ Reimagine navigation components
8. ⏳ Update styling to use shadcn design system
9. ⏳ Test all components after migration

## LLM Prompt Strategy

### Image Extraction Prompt
```
You are a recipe extraction expert. Analyze the provided image and extract the recipe information in the following JSON structure:

{
  "title": "string",
  "description": "string (optional)",
  "prepTime": number (minutes, optional),
  "cookTime": number (minutes, optional),
  "servings": number (optional),
  "difficulty": "easy" | "medium" | "hard" (optional),
  "cuisine": "string (optional)",
  "tags": ["string"],
  "ingredients": [
    {
      "name": "string",
      "amount": number (optional),
      "unit": "string (optional)",
      "notes": "string (optional)"
    }
  ],
  "instructions": [
    {
      "step": number,
      "instruction": "string"
    }
  ],
  "nutrition": {
    "calories": number (optional),
    "protein": number (optional),
    "carbs": number (optional),
    "fat": number (optional)
  } (optional)
}

Extract all visible recipe information from the image. If information is missing, omit those fields.
```

### URL Extraction Prompt
```
You are a recipe extraction expert. Analyze the provided webpage content and extract the recipe information in the following JSON structure:

[Same structure as above]

Focus on extracting the main recipe from the page, ignoring advertisements, comments, and other non-recipe content.
```

## Environment Variables

### Development (.env.local)
```env
# Database - SQLite for local development
DATABASE_URL="file:./dev.db"

# AI/LLM - OpenAI
OPENAI_API_KEY="sk-..."
AI_MODEL="gpt-4-vision-preview"  # For image extraction
AI_MODEL_TEXT="gpt-4-turbo-preview"  # For URL extraction

# Storage - Vercel Blob
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# App
NODE_ENV="development"
```

### Production (.env.production)
```env
# Database - Vercel Postgres
POSTGRES_URL="postgresql://..."
POSTGRES_PRISMA_URL="postgresql://..."
POSTGRES_URL_NON_POOLING="postgresql://..."

# AI/LLM - OpenAI
OPENAI_API_KEY="sk-..."
AI_MODEL="gpt-4-vision-preview"
AI_MODEL_TEXT="gpt-4-turbo-preview"

# Storage - Vercel Blob
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# App
NODE_ENV="production"
```

**Note**: TanStack Start will handle environment variable loading. Use `process.env` in server functions and `import.meta.env` in client code where needed.

## Future Enhancements (Post-MVP)

1. **MCP Server Integration**: If needed for advanced LLM interactions
2. **Recipe Sharing**: Public/private recipe sharing
3. **Meal Planning**: Weekly meal planning with recipes
4. **Shopping Lists**: Generate shopping lists from recipes
5. **Recipe Scaling**: Scale ingredients for different serving sizes
6. **Recipe Variations**: Store and compare recipe variations
7. **User Authentication**: Multi-user support
8. **Recipe Collections**: Organize recipes into collections/cookbooks
9. **Recipe Import/Export**: Import from other platforms, export to various formats
10. **AI Recipe Suggestions**: Generate recipe variations or substitutions
11. **Servings Relevance**: Add a field to mark whether servings are relevant for a recipe (e.g., irrelevant for cakes, relevant for main dishes). Hide servings display on recipe detail page when marked as irrelevant, but keep the field in the database and allow editing.

## Technical Considerations

### TanStack Start Specifics
- **Server Functions**: Use TanStack Start's server function pattern for API endpoints
- **File-based Routing**: Routes are defined by file structure in `src/routes/`
- **SSR & Data Loading**: Use route loaders for server-side data fetching
- **Type Safety**: Leverage TanStack Start's end-to-end type safety between server and client
- **Deployment**: TanStack Start apps can be deployed to Vercel, Cloudflare, or other platforms

### Image Processing
- Support common formats: JPEG, PNG, WebP
- Client-side compression before upload (reduce file size)
- Server-side validation (file type, size limits)
- Upload to Vercel Blob storage
- Store blob URLs in database
- Leverage Vercel Blob's CDN for fast image delivery

### URL Processing
- Handle both static and dynamic (JS-rendered) pages
- Use Puppeteer or Playwright for JS-heavy sites (optional, adds complexity)
- Fallback to simple fetch for static content
- Extract main content using libraries like `cheerio` or `jsdom`
- Handle rate limiting and timeouts gracefully
- Consider caching fetched content to avoid re-fetching

### LLM Response Handling
- Use OpenAI's structured output (JSON mode) when available
- Implement retry logic with exponential backoff for failed extractions
- Validate LLM responses with Zod schemas matching database schema
- Handle partial extractions gracefully (allow saving incomplete recipes)
- Allow manual correction of extracted data before final save
- Log extraction failures for debugging and improvement

### Performance
- Implement caching for recipe queries with TanStack Query
- Use TanStack Start's built-in SSR and data loading
- Optimize images from Vercel Blob (leverage CDN)
- Implement pagination for large recipe lists
- Use TanStack Start's code splitting and lazy loading

## Dependencies (package.json preview)

```json
{
  "dependencies": {
    "@tanstack/start": "^1.0.0",
    "@tanstack/react-router": "^1.0.0",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-table": "^8.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "ai": "^3.0.0",
    "drizzle-orm": "^0.29.0",
    "@vercel/postgres": "^0.5.0",
    "better-sqlite3": "^9.0.0",
    "zod": "^3.22.0",
    "@vercel/blob": "^0.20.0",
    "openai": "^4.20.0",
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-*": "...",
    "react-dropzone": "^14.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/better-sqlite3": "^7.6.0",
    "typescript": "^5.0.0",
    "drizzle-kit": "^0.20.0",
    "vite": "^5.0.0"
  }
}
```

## Database Configuration Strategy

### Conditional Database Setup
Since we're using Postgres in production and SQLite in development, we need a strategy to handle both:

```typescript
// src/db/client.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import postgres from 'postgres';
import Database from 'better-sqlite3';
import * as schema from './schema';

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  const client = postgres(process.env.POSTGRES_URL!);
  export const db = drizzle(client, { schema });
} else {
  const sqlite = new Database('./dev.db');
  export const db = drizzleSqlite(sqlite, { schema });
}
```

### Drizzle Configuration
```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  ...(isProduction
    ? {
        dialect: 'postgresql',
        dbCredentials: {
          url: process.env.POSTGRES_URL!,
        },
      }
    : {
        dialect: 'sqlite',
        dbCredentials: {
          url: './dev.db',
        },
      }),
} satisfies Config;
```

## Vercel Blob Integration

### Setup
1. Install Vercel Blob package: `@vercel/blob`
2. Get Blob storage token from Vercel dashboard
3. Create wrapper in `src/lib/storage/blob.ts`:

```typescript
import { put } from '@vercel/blob';

export async function uploadImage(file: File): Promise<string> {
  const blob = await put(file.name, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN!,
  });
  return blob.url;
}
```

## OpenAI Integration Details

### Image Extraction
- Use GPT-4 Vision model (`gpt-4-vision-preview` or `gpt-4o`)
- Send image URL from Vercel Blob
- Request structured JSON output matching recipe schema
- Use function calling or JSON mode for structured output

### URL Extraction
- Use GPT-4 Turbo (`gpt-4-turbo-preview` or `gpt-4o`)
- Fetch webpage content first (handle JS-rendered pages if needed)
- Send extracted text content to LLM
- Request structured JSON output matching recipe schema

## Next Steps

1. Review and approve this plan
2. Initialize the TanStack Start project:
   ```bash
   npm create tanstack-start@latest recipe-book
   ```
3. Set up database configuration (Postgres/SQLite conditional setup)
4. Define Drizzle schema and run initial migrations
5. Set up Vercel Blob storage integration
6. Implement API routes incrementally (server functions)
7. Build frontend components with TanStack Router
8. Test end-to-end workflows locally with SQLite
9. Deploy to Vercel with Postgres database
10. Configure production environment variables

---

**Note on MCP Server**: We are not implementing an MCP server. The LLM will extract recipe data and return it as JSON, which our server functions will then store in the database. This keeps the architecture simple and straightforward for the MVP.

