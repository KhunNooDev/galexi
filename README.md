# Galexi

Galexi is a Next.js task workspace with authentication, private per-user data, internationalization, and light/dark themes.

## Stack

- Next.js 16 and React 19
- Tailwind CSS 4
- Supabase Auth and PostgreSQL
- Drizzle ORM with code-first migrations
- Hono API routes
- React Hook Form and Zod validation
- `next-intl` with English and no locale sub-path
- `next-themes` and Lucide React

## Local setup

Install dependencies:

```bash
pnpm install
```

Copy `.env.example` to `.env.local` and set the Supabase database and public Auth values.

Apply the existing database migrations:

```bash
pnpm db:migrate
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

- `/` — Galexi landing page
- `/auth` — sign in or create an account
- `/profile` — authenticated account details
- `/tasks` — authenticated task manager
- `/api/tasks` — authenticated Hono CRUD API

## Scripts

```bash
pnpm dev          # Start development mode
pnpm build        # Create a production build
pnpm start        # Start the production server
pnpm lint         # Run ESLint
pnpm format       # Format and fix the project
pnpm format:check # Check formatting and linting
pnpm db:generate  # Generate a Drizzle migration
pnpm db:migrate   # Apply Drizzle migrations
pnpm db:check     # Validate Drizzle migrations
pnpm db:studio    # Open Drizzle Studio
```

Translation messages live in `src/i18n/locales/en.json`. Routes do not include a locale prefix.
