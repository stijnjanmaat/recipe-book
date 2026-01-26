# Recipe Book

A TypeScript full-stack application using TanStack Start that collects recipes via AI-powered extraction from images and URLs. Recipes are stored in a structured PostgreSQL database with authentication, internationalization, and a modern UI.

## Tech Stack

- **Framework**: TanStack Start (React + Vite + TanStack Router)
- **Database**: PostgreSQL (via Docker Compose locally, Vercel Postgres in production)
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth (Google OAuth only)
- **AI/LLM**: OpenAI API (GPT-4o for image and URL extraction)
- **Storage**: Vercel Blob Storage
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **i18n**: React i18next (English & Dutch)
- **State Management**: TanStack Query (React Query)

## Prerequisites

- Node.js 24.x
- pnpm >= 8.0.0
- Docker and Docker Compose (for local database)

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and configure all required variables:

#### Database
- `DATABASE_URL` - PostgreSQL connection string (defaults to Docker Compose instance)

#### AI/LLM
- `OPENAI_API_KEY` - Your OpenAI API key (required for recipe extraction)
- `AI_MODEL` - Model for image extraction (default: `gpt-4o`)
- `AI_MODEL_TEXT` - Model for URL extraction (default: `gpt-4o`)

#### Storage
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token (for recipe images)

#### Authentication (Better Auth)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `BETTER_AUTH_URL` - Base URL for auth callbacks (e.g., `http://localhost:3000` for dev, your production URL for prod)
- `SUPERADMIN_EMAILS` - Comma-separated list of email addresses that should have superadmin access

#### App
- `NODE_ENV` - Environment mode (`development` or `production`)

### 3. Start PostgreSQL Database

Start the PostgreSQL database using Docker Compose:

```bash
pnpm db:up
```

This starts a PostgreSQL 16 container on port 5433 with:
- Database: `recipebook`
- User: `recipebook`
- Password: `recipebook`

### 4. Run Database Migrations

Apply database migrations:

```bash
# Apply migrations
pnpm db:migrate

# Or push schema directly (for development only)
pnpm db:push
```

### 5. Start Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

## Database Commands

- `pnpm db:up` - Start PostgreSQL container
- `pnpm db:down` - Stop PostgreSQL container
- `pnpm db:logs` - View PostgreSQL logs
- `pnpm db:generate` - Generate migration files from schema changes
- `pnpm db:migrate` - Apply migrations
- `pnpm db:push` - Push schema changes directly (dev only, skips migrations)
- `pnpm db:studio` - Open Drizzle Studio (database GUI)
- `pnpm db:reset` - Drop database and re-run migrations (⚠️ destructive)

## Project Structure

```
src/
├── routes/          # TanStack Router file-based routes (pages & API endpoints)
├── components/      # React components (UI components, RecipeTable, LanguageSwitcher)
├── db/              # Database schema, client, and migrations
├── lib/             # Utilities and services
│   ├── auth/        # Authentication utilities (Better Auth)
│   ├── ai/          # AI/LLM integration for recipe extraction
│   ├── storage/     # Vercel Blob storage utilities
│   ├── i18n/        # Internationalization (English & Dutch)
│   └── utils/       # Helper functions (ingredient scaling, interpolation)
├── middleware/      # Server middleware (auth protection)
├── hooks/           # React hooks (useAuth, useRecipes)
└── types/           # TypeScript type definitions
```

## Features

### Authentication
- **Better Auth** with Google OAuth only (no email/password)
- Superadmin role-based access control
- Client and server-side auth checks

### Recipe Management
- Extract recipes from images using GPT-5.2
- Extract recipes from URLs
- View, edit, and delete recipes
- Search and filter recipes
- Scale ingredients based on servings
- Ingredient interpolation in instructions
- Tag support

### Internationalization
- English and Dutch language support

### UI/UX
- Modern, clean design with shadcn/ui components
- Responsive layout
- PWA support (mobile home screen installation)

## Development

### Route Generation
TanStack Router uses file-based routing. After adding/modifying routes, regenerate the route tree:

```bash
pnpm tsr:generate
```

### Building for Production

```bash
pnpm build:prod
```

This runs migrations and builds the application. The output is in `.output/` directory.

## Production Deployment

### Vercel Deployment

1. Set up Vercel Postgres database in Vercel dashboard
2. Configure all environment variables in Vercel dashboard:
   - `DATABASE_URL` (from Vercel Postgres)
   - `OPENAI_API_KEY`
   - `BLOB_READ_WRITE_TOKEN`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `BETTER_AUTH_URL` (your production URL)
   - `SUPERADMIN_EMAILS`
3. Deploy - Vercel will run `build:prod` which includes migrations

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)
6. Copy Client ID and Client Secret to environment variables

## License

ISC
