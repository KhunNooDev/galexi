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

Enable Anonymous Sign-Ins in the Supabase Auth provider settings before using the learning
onboarding flow. Anonymous accounts are created only when a visitor chooses to start learning,
never during ordinary page visits.

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

- `/`: Galexi landing page
- `/auth`: sign in or create an account
- `/profile`: authenticated account details
- `/admin/words`: administrator vocabulary manager for the global dictionary
- `/admin/words/[id]`: administrator flashcard details
- `/words/search`: public vocabulary directory for members and guests
- `/words/search/[word]`: public flashcards for a word
- `/categories`: public vocabulary topics
- `/categories/[slug]`: public words within a topic
- `/learn/start`: learning entry and durable onboarding resume
- `/learn/start/goal`: learning goal selection
- `/learn/start/level`: current English level selection
- `/learn/start/ready`: completed onboarding handoff
- `/learn`: personal learning home and authoritative continuation entry
- `/learn/save`: optional Guest account upgrade or secure merge into an existing account
- `/learn/lesson/[lessonKey]`: owned, resumable Learn, Practice, and Mini Conversation flow
- `/learn/lesson/[lessonKey]/result/[sessionId]`: owned, stable lesson result
- `/admin/categories`: administrator category manager
- `/api/words`: administrator-only Hono CRUD API for global vocabulary entries
- `/api/categories`: administrator-only Hono CRUD API for categories

Public visitors, guests, and members can read published entries. Administrators can view and manage
every entry, including unpublished entries. Guests and permanent users share the same server-only
learning onboarding, lesson, deterministic practice, guided conversation, result, and persistence
model.
Guest persistence requires Anonymous Sign-Ins to be enabled in the connected Supabase Auth project. See
[Architecture](docs/architecture.md) for the data model and permission boundaries.

## Saving Guest progress

Galexi keeps Guest learning optional. A Guest can continue learning without creating a permanent
account, or choose **Save my progress** from the learning home.

- Creating a new email and password account upgrades the current anonymous Supabase user. The Auth
  user ID stays the same, so learning ownership does not need to be rewritten.
- Signing in to an existing account creates a 15-minute, one-time transfer before the Guest session
  is replaced. After sign-in, the server derives the destination from the current session and merges
  the Guest learning data in one transaction.
- Transfer bearer tokens are stored only in an HttpOnly, SameSite cookie. PostgreSQL stores only the
  SHA-256 token hash, and normal Data API roles have no access to the transfer table.

For same-user conversion, Supabase Anonymous Sign-Ins and manual identity linking must be enabled.
Email confirmation behavior follows the Auth project settings. When email confirmation is required,
the learner verifies the email before setting a password. The callback URL must allow
`/auth/callback` for the deployed application origin.

## Identity boundary

Galexi resolves every request to one application identity: `public`, `guest`, `member`, or `admin`.
Public visitors have no Supabase session. Guests use Supabase Anonymous Sign-In and have an Auth user
ID, but they are not members and do not receive profile or role rows. Permanent accounts use
`user_roles` as the authorization source.

`profiles` describes a permanent user through application-facing fields such as display name and
avatar. `user_roles` separately controls what that user is allowed to do through the `member` and
`admin` roles. Galexi never derives authorization from profile data, email addresses, Supabase user
metadata, or client-side state.

- Guests can read public dictionary entries and try the learning experience.
- Members can read public entries and use the same learning onboarding flow.
- Administrators can manage the shared Global Dictionary.

## Scripts

```bash
pnpm dev          # Start development mode
pnpm build        # Create a production build
pnpm start        # Start the production server
pnpm lint         # Run ESLint
pnpm test         # Run focused domain tests
pnpm format       # Format and fix the project
pnpm format:check # Check formatting and linting
pnpm db:generate  # Generate a Drizzle migration
pnpm db:migrate   # Apply Drizzle migrations
pnpm db:check     # Validate Drizzle migrations
pnpm db:studio    # Open Drizzle Studio
```

Translation messages live in `src/i18n/locales/en.json`. Routes do not include a locale prefix.
