# Galexi architecture

## Global dictionary

The `words` table is a shared, system-wide dictionary. A vocabulary entry does not belong to an
individual user. Administrators manage the same collection, and the case-insensitive combination
of `word` and `part_of_speech` is unique across the entire dictionary.

Each entry has nullable audit references:

- `created_by` records the administrator who created the entry.
- `updated_by` records the administrator who most recently changed the entry.

Both columns reference `auth.users.id` with `ON DELETE SET NULL`. Removing an administrator account
therefore removes the audit association without deleting or reassigning dictionary content. These
fields are audit metadata and are not used as ownership or authorization boundaries.

Vocabulary topics use a normalized many-to-many model. `categories` stores the reusable topic
name, URL slug, and display order, while `word_categories` links any word to any number of topics.
Deleting a category cascades only to its link rows; it never deletes dictionary entries.

## Access model

| Actor         | Current dictionary access                                       | Planned member capabilities                              |
| ------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Guest         | Read public entries and try the learning experience             | None                                                     |
| Member        | Read public entries and try the learning experience             | Report incorrect information and track learning progress |
| Administrator | Read and manage all Global Dictionary entries, including drafts | None                                                     |

The learning onboarding UI, first vocabulary lesson, deterministic Practice phase, guided Mini
Conversation, and persistence foundation are implemented. Correction reports remain planned and do
not affect the current permission model.

## Learning data

Guest and permanent identities use the same ownership model for learning state. Every learning row
references `auth.users.id`; a guest who links an identity while retaining the same Auth user ID keeps
all learning data without a database migration.

The connected Supabase Auth project must have Anonymous Sign-Ins enabled before the application can
create Guest identities. RLS treats those anonymous Auth users as `authenticated` and still isolates
every row by `auth.uid()`.

| Table                | Purpose                                        | Ownership key         |
| -------------------- | ---------------------------------------------- | --------------------- |
| `learning_profiles`  | Goal, level, and onboarding completion         | `user_id` primary key |
| `learning_sessions`  | Resumable and historical lesson session state  | `user_id`             |
| `user_word_progress` | Long-term counts and mastery for a global Word | `(user_id, word_id)`  |

### Saving a Guest account

`/learn/save` provides two deliberately separate account paths:

1. A new account uses Supabase's supported anonymous-user email upgrade. Email verification and
   password setup happen on the current Auth user, so its UUID and every learning foreign key stay
   unchanged. The application then lazily establishes the normal member role and profile. Existing
   admin roles are never downgraded.
2. An existing account uses a server-created `learning_account_transfers` record before sign-in
   replaces the Guest session. The browser receives an opaque 32-byte token in an HttpOnly,
   SameSite=Lax cookie. PostgreSQL stores only its SHA-256 hash. The record expires after 15 minutes
   and can be consumed once.

The existing-account destination is always derived from the current permanent Supabase session.
The client never supplies a source or destination user ID. The source comes from the transfer row,
which was created only while that source Guest controlled the current authenticated session. The
transfer table has RLS enabled and grants no access to `anon` or `authenticated`; only the server's
direct database boundary can create or consume a transfer.

Transfer consumption locks the transfer row with `FOR UPDATE`, so duplicate requests using the same
one-time token serialize before any learning data changes. The same transaction applies these
deterministic merge rules:

- `learning_profiles`: destination goal and level win when present; Guest values fill only missing
  fields. Onboarding remains completed only when the merged profile has both required choices.
- `learning_sessions`: all history moves to the destination. If both users have an in-progress
  attempt for the same lesson, the furthest valid phase wins, then the newest update, then the
  newest start time, and finally the stable session ID. Other active attempts become abandoned.
- `user_word_progress`: independent counters are added with PostgreSQL integer saturation,
  `last_seen_at` keeps the latest value, and mastery keeps the strongest bounded value. Prompt 5
  mastery is incremental and order-dependent, so aggregate counters cannot reconstruct it without
  inventing a new formula.

A committed transfer stores the destination and consumption time. Replaying the same token for the
same destination returns the already-consumed result without applying counts or sessions again.
Concurrent requests serialize on the locked transfer. A critical merge error rolls back both data
changes and token consumption, leaving the transfer retryable until expiry. Expired and consumed
records are retained briefly for audit and idempotency, then opportunistically removed after seven
days when a later transfer is created.

The source anonymous Auth user is not deleted by the merge. Its learning rows have been moved or
combined, but Auth lifecycle cleanup remains a separate privileged maintenance concern. This avoids
putting destructive Auth administration in a learner-facing request.

Learning goals and levels use small PostgreSQL enums matching the application-supported values.
Session status is `in_progress`, `completed`, or `abandoned`; current step and score ranges are
database constrained, session JSON is limited to 32 KiB, and completion timestamps must agree with
completed status. Word progress counters cannot be negative and mastery is an integer from 0 to 100.

All learning references to `auth.users` use `ON DELETE CASCADE`. Deleting a dictionary Word also
cascades its progress rows because progress has no meaning without its global dictionary entry. The
dictionary remains system-wide and is never owned by a learner.

RLS isolates authenticated guests and permanent users to rows where
`(select auth.uid()) = user_id`. Direct clients have read-only access to learning profiles and cannot
mutate goal, level, or onboarding completion state. All onboarding mutations run through the
server-only learning service, which independently derives the current identity and includes the
owner predicate in every query; it never accepts a client-provided owner ID. There is no direct
learning-row DELETE or TRUNCATE privilege. Lifecycle deletion occurs through the user and Word
foreign keys.

The first-flow indexes support current session lookup by user, status, and recent update; session
history by user and start time; recent Word progress by user and last-seen time; and efficient Word
foreign-key cleanup. The composite progress primary key already supports exact user-and-Word lookup.

## Identity, profiles, and authorization

Supabase `auth.users` remains the source of authentication data. The application deliberately keeps
descriptive profile data and authorization state in separate tables:

| Identity | Resolution rule                                      | Application access                   |
| -------- | ---------------------------------------------------- | ------------------------------------ |
| Public   | No Supabase user or session                          | Published dictionary content         |
| Guest    | Supabase user has `is_anonymous = true`              | Published content and learning setup |
| Member   | Permanent user has the `member` role in `user_roles` | Member account and profile           |
| Admin    | Permanent user has the `admin` role in `user_roles`  | Dictionary management                |

The server-only identity resolver checks the anonymous Auth state before reading or creating a role.
This prevents an anonymous user from being converted into an application member as a side effect of
rendering a header or checking a route. Guest sessions are created only by an explicit learning entry
action. Existing guest and permanent sessions are reused, and a permanent session is never replaced
with an anonymous session.

| Table        | Responsibility                          | Fields                                              |
| ------------ | --------------------------------------- | --------------------------------------------------- |
| `profiles`   | Describes the user inside Galexi        | `user_id`, `display_name`, `avatar_url`, timestamps |
| `user_roles` | Controls what the user is allowed to do | `user_id`, `role` (`member` or `admin`)             |

Authorization decisions use only `user_roles` through server-only role helpers or the equivalent
database policy. Profile fields, Auth email addresses, user metadata, and client-side state are
never authorization sources. Profile mutations accept only `display_name` and `avatar_url`; role
changes require a separate future admin-only workflow.

Profiles are created lazily on the server for permanent accounts and use the Auth user ID as their
primary key. Permanent users can read and update only their own profile through row-level security.
Deleting an Auth user cascades to the related profile and role records.

Role and profile lifecycles are independent. A missing role record for a permanent account is created
as `member` without reading or changing `profiles`; a missing profile is created with empty
application fields without reading or changing `user_roles`. Anonymous accounts create neither.
Pages that need both load them independently and combine the results only for presentation.

Row-level security mirrors this model: public and authenticated users can select published rows,
while only permanent authenticated users may select their own role or select and update their own
profile fields. These permanent-user policies check the Supabase `is_anonymous` JWT claim because
Supabase guests also use the PostgreSQL `authenticated` role. No authenticated-user grant or policy
permits direct role updates. The administrator policy permits dictionary management based on
`user_roles`, and Hono mutation routes independently require the administrator identity before
calling the dictionary server functions.

Category policies follow the same boundary. Guests and members can see only categories and
relationships connected to public words. Administrators manage all categories and relationships.
Public category pages still join through `words.is_public = true`, so a private word cannot be
revealed through category navigation.

## Application flow

### Learning onboarding and Lesson 1

- The landing page remains public and does not create an Auth user during rendering.
- Choosing Start learning creates a Supabase anonymous Guest only when no existing session is
  present. Existing Guest, Member, and Admin sessions are reused. Learners with completed onboarding
  go directly to `/learn`, where the continuation resolver chooses their next action.
- `/learn/start` reads `learning_profiles` and resumes at the first missing choice. A profile with a
  goal and level but no completion timestamp is repaired safely before the Ready handoff. Completed
  profiles redirect to `/learn` instead of showing Ready again.
- Goal and level selections are validated and persisted immediately through authenticated Server
  Actions. The browser does not keep canonical onboarding state in local storage or the URL.
- Selecting a level completes onboarding only when the current user's persisted goal exists.
- `/learn/start/ready` remains the first-time handoff into the code-defined Lesson 1 catalog. Direct
  visits are harmless, but normal returning entry does not route through it.
- `/learn/lesson/[lessonKey]` loads only published Global Dictionary entries. A curated lesson fails
  closed if any required Word is missing or unpublished.
- Lesson entry resumes the latest owned `in_progress` session or creates one under a transaction
  advisory lock. Older duplicate sessions for the same user and lesson are abandoned.
- Advancing a card saves the authoritative position before the client moves. Expected Word and step
  values make retries and stale tabs idempotent instead of skipping cards or moving progress back.
- First exposure updates only `seen_count` and `last_seen_at`. Learn does not change correctness,
  incorrectness, score, or mastery.
- Completing Learn changes the session phase to the Practice handoff while leaving the session
  `in_progress`.
- Practice contains six deterministic multiple-choice questions derived from the six Lesson 1
  dictionary records. Correctness is resolved on the server from the authoritative question
  definition; the client submits only stable question and option identifiers.
- A session-scoped PostgreSQL advisory transaction lock serializes scoring and conversation
  progression. The same transaction writes the scored answer into session JSON and updates the
  related Word progress, so the two records cannot disagree. Repeating the same answer is
  idempotent, while stale questions, different second answers, and out-of-order transitions fail.
- Practice stores the selected option, target Word, and correctness for each question. Answered and
  correct totals are derived from that list, incorrect is `answered - correct`, and the session
  `score` stores percentage accuracy from 0 to 100.
- A correct Practice attempt increments `correct_count` and mastery by 10. An incorrect attempt
  increments `incorrect_count` and reduces mastery by 5. Mastery is clamped from 0 to 100, and both
  outcomes update `last_seen_at`. Practice never increments `seen_count`.
- `seen_count` remains Learn-phase exposure, `correct_count` and `incorrect_count` represent scored
  Practice attempts, `last_seen_at` records the latest meaningful interaction with a Word, and
  `mastery` is the bounded correctness signal described above.
- Completing Practice advances the same `in_progress` session to Conversation. Three code-defined
  guided turns use stable response identifiers and Lesson 1 vocabulary. Conversation is
  participation-based, does not alter correctness counters, and updates only `last_seen_at` for
  words used by the selected response.
- Completing Conversation advances the session to the Result handoff. The session-specific Result
  route validates ownership and activity completion, snapshots authoritative practice,
  participation, and mastery values into session JSON, then marks the session completed exactly once
  under the same advisory lock. Reopening the route reads the stable snapshot instead of recalculating
  historical metrics from current Word progress.
- `/learn` is the personal learning home for Guest, Member, and Admin identities. Its server-only
  continuation resolver prioritizes incomplete onboarding, then the current Learn, Practice,
  Conversation, or Result phase, then the next catalog lesson. When no later lesson exists, the home
  reports that the available catalog is complete without creating another session.

- Public search and flashcard queries always filter on `is_public = true`.
- Administrator list and detail queries operate on the complete global dictionary and never filter
  by an administrator ID.
- Creating an entry sets both audit fields to the current administrator ID.
- Updating an entry leaves `created_by` unchanged and sets `updated_by` to the current
  administrator ID.
- Word images are stored in Supabase Storage and referenced by the dictionary entry.

### Word image consistency

The browser uploads a candidate image directly to the private `word-images` bucket before saving
the Word. PostgreSQL remains authoritative: `words.image_url` determines whether a Storage object is
in use. If a save has an uncertain client outcome, the browser may request cleanup, but only the
server decides whether removal is safe by checking the current dictionary references first.

Image replacement and Word deletion commit their database changes before the previous image becomes
a cleanup candidate. Every automatic cleanup path uses the same database-aware service and retains
any referenced object. Saves and cleanup coordinate with the same path-scoped PostgreSQL advisory
lock. A save that introduces an image reference verifies the Storage object while holding that lock,
so cleanup cannot race a pending save into committing a missing image. Cleanup is idempotent and
best-effort; a temporary Storage failure may leave an orphan object, which is preferable to a
dictionary row referencing a missing image.

### Feature ownership

`src/app` remains the routing and page-composition layer. Word-, Category-, and Learning-specific
schemas and server-only database operations live under their matching feature directories. Word and
Category UI, typed Hono RPC wrappers, and TanStack Query hooks remain feature-owned. Shared form
controls and UI primitives remain in `src/components`, while database, Supabase, environment,
internationalization, profile, and role infrastructure stay outside the product features.

The dependency direction is App Router → features → shared UI and infrastructure. Feature client
components can use their typed API wrappers, but cannot import the server-only service directories.
Server Components call feature services directly rather than making HTTP requests to Galexi's API.

### Data access boundaries

Server Components read application data directly through the server-only modules. They do not make
HTTP requests back to the application's own API:

```text
Server Component -> src/features/*/server -> Drizzle -> PostgreSQL
```

Interactive administrator Words CRUD uses a small client-side server-state layer. The `/admin/words`
Server Component still reads the initial list with `listWords()` and passes it to the client as
TanStack Query initial data. Subsequent reads and mutations follow this path:

```text
Client Component -> TanStack Query -> feature API wrapper -> typed Hono client
                 -> Next.js API entry -> root Hono API -> feature route
                 -> feature server layer -> Drizzle / external service
```

Only the reusable API client instantiates `hc<ApiType>`. Components and query hooks do not know the
Hono route structure, and feature database operations remain confined to server-only feature
services. Shared authorization and profile helpers remain in `src/server`. Authentication and
profile forms continue to use their existing Server Actions.

The optional catch-all Next.js API entry only adapts the composed Hono application to Next.js. The
root Hono module applies the `/api` base path, composes feature-owned Word, Category, and Word Image
routers, and provides the unexpected-error fallback. Shared administrator middleware authenticates
the request, resolves authorization from `user_roles`, and exposes `adminUserId` to protected route
handlers. Expected duplicate errors are mapped by the owning feature router so domain responses stay
accurate.

### App Router boundaries

- `loading.tsx` represents expected pending work and keeps shared layouts interactive.
- `notFound()` represents a genuinely missing public resource or administrator dictionary entry.
- `error.tsx` handles unexpected runtime failures without exposing internal error details.
- Authentication failures redirect to sign in; they are not presented as missing resources.
- Authenticated users without administrator access redirect to public vocabulary; route names do
  not replace server-side authorization checks.
