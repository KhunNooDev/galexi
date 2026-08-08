# Galexi

Galexi is an admin-managed global dictionary with public vocabulary flashcards, authentication,
internationalization, and light/dark themes. Dictionary entries are shared system-wide rather
than owned by individual users.

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
- `/words` — administrator vocabulary manager for the global dictionary
- `/words/[id]` — administrator flashcard details
- `/words/search` — public vocabulary directory for members and guests
- `/words/search/[word]` — public flashcards for a word
- `/api/words` — administrator-only Hono CRUD API for global vocabulary entries

Guests and members can read published entries. Administrators can view and manage every entry,
including unpublished entries. See [Architecture](docs/architecture.md) for the data model and
permission boundaries.

## Identity boundary

`profiles` describes a user through application-facing fields such as display name and avatar.
`user_roles` separately controls what that user is allowed to do through the `member` and `admin`
roles. Galexi never derives authorization from profile data, email addresses, Supabase user metadata,
or client-side state.

- Guests can read public dictionary entries and try the learning experience.
- Members can read public entries; correction reports and learning progress are planned for later.
- Administrators can manage the shared Global Dictionary.

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
