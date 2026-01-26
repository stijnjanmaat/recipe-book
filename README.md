# Recipe Book

A TypeScript application using TanStack Start that collects recipes via LLM processing of images, photos, screenshots, and URLs. Recipes are stored in a structured PostgreSQL database.

## Tech Stack

- **Framework**: TanStack Start (React + Vite)
- **Database**: PostgreSQL (via Docker Compose locally, Vercel Postgres in production)
- **ORM**: Drizzle ORM
- **AI**: OpenAI API (GPT-4o)
- **Storage**: Vercel Blob Storage
- **Styling**: Tailwind CSS v4

## Prerequisites

- Node.js 22+
- pnpm
- Docker and Docker Compose

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

Edit `.env.local` and add your API keys:
- `OPENAI_API_KEY` - Your OpenAI API key
- `BLOB_READ_WRITE_TOKEN` - Your Vercel Blob storage token
- `DATABASE_URL` - Will use the Docker Compose Postgres by default

### 3. Start PostgreSQL Database

Start the PostgreSQL database using Docker Compose:

```bash
pnpm db:up
```

This will start a PostgreSQL 16 container on port 5433 (to avoid conflicts with local PostgreSQL) with:
- Database: `recipebook`
- User: `recipebook`
- Password: `recipebook`

### 4. Run Database Migrations

Generate and apply database migrations:

```bash
# Generate migration files
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Or push schema directly (for development)
pnpm db:push
```

### 5. Start Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000` (or the port Vite assigns).

## Database Commands

- `pnpm db:up` - Start PostgreSQL container
- `pnpm db:down` - Stop PostgreSQL container
- `pnpm db:logs` - View PostgreSQL logs
- `pnpm db:generate` - Generate migration files
- `pnpm db:migrate` - Run migrations
- `pnpm db:push` - Push schema changes directly (dev only)
- `pnpm db:studio` - Open Drizzle Studio (database GUI)

## Project Structure

```
src/
├── routes/          # TanStack Router file-based routes
├── components/      # React components
├── db/              # Database schema and client
│   ├── schema.ts    # Drizzle schema definitions
│   ├── client.ts    # Database connection
│   └── migrations/  # Database migrations
├── lib/             # Utilities and services
│   ├── ai/          # LLM integration
│   └── storage/     # Vercel Blob integration
└── types/           # TypeScript type definitions
```

## Development

The project uses:
- **PostgreSQL** for all environments (local via Docker, production via Vercel)
- **Drizzle ORM** for database operations
- **TanStack Router** for file-based routing
- **TanStack Query** for server state management
- **Tailwind CSS v4** for styling

## Production Deployment

For production deployment on Vercel:
1. Set up Vercel Postgres database
2. Configure environment variables in Vercel dashboard
3. Update `DATABASE_URL` to point to Vercel Postgres
4. Deploy

## License

ISC
