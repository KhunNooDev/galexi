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

The planned member capabilities are not implemented yet and do not affect the current permission
model.

## Identity, profiles, and authorization

Supabase `auth.users` remains the source of authentication data. The application deliberately keeps
descriptive profile data and authorization state in separate tables:

| Table        | Responsibility                          | Fields                                              |
| ------------ | --------------------------------------- | --------------------------------------------------- |
| `profiles`   | Describes the user inside Galexi        | `user_id`, `display_name`, `avatar_url`, timestamps |
| `user_roles` | Controls what the user is allowed to do | `user_id`, `role` (`member` or `admin`)             |

Authorization decisions use only `user_roles` through server-only role helpers or the equivalent
database policy. Profile fields, Auth email addresses, user metadata, and client-side state are
never authorization sources. Profile mutations accept only `display_name` and `avatar_url`; role
changes require a separate future admin-only workflow.

Profiles are created lazily on the server and use the Auth user ID as their primary key. Authenticated
users can read and update only their own profile through row-level security. Deleting an Auth user
cascades to the related profile and role records.

Role and profile lifecycles are independent. A missing role record is created as `member` without
reading or changing `profiles`; a missing profile is created with empty application fields without
reading or changing `user_roles`. Pages that need both load them independently and combine the
results only for presentation.

Row-level security mirrors this model: anonymous and authenticated users can select published rows,
authenticated users may select only their own role, and they may select and update only their own
profile fields. No authenticated-user grant or policy permits direct role updates. The administrator
policy permits dictionary management based on `user_roles`, and Hono mutation routes independently
require the administrator role before calling the dictionary server functions.

Category policies follow the same boundary. Guests and members can see only categories and
relationships connected to public words. Administrators manage all categories and relationships.
Public category pages still join through `words.is_public = true`, so a private word cannot be
revealed through category navigation.

## Application flow

- Public search and flashcard queries always filter on `is_public = true`.
- Administrator list and detail queries operate on the complete global dictionary and never filter
  by an administrator ID.
- Creating an entry sets both audit fields to the current administrator ID.
- Updating an entry leaves `created_by` unchanged and sets `updated_by` to the current
  administrator ID.
- Word images are stored in Supabase Storage and referenced by the dictionary entry.

### Feature ownership

`src/app` remains the routing and page-composition layer. Word- and Category-specific UI, schemas,
typed Hono RPC wrappers, TanStack Query hooks, and server-only database operations live under
`src/features/words` and `src/features/categories`. Shared form controls and UI primitives remain in
`src/components`, while database, Supabase, environment, internationalization, profile, and role
infrastructure stay outside the product features.

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
Client Component -> TanStack Query -> Words API wrapper -> Hono RPC -> Hono API
                 -> src/features/*/server -> Drizzle -> PostgreSQL
```

Only the reusable API client instantiates `hc<ApiType>`. Components and query hooks do not know the
Hono route structure, and feature database operations remain confined to server-only feature
services. Shared authorization and profile helpers remain in `src/server`. Authentication and
profile forms continue to use their existing Server Actions.

### App Router boundaries

- `loading.tsx` represents expected pending work and keeps shared layouts interactive.
- `notFound()` represents a genuinely missing public resource or administrator dictionary entry.
- `error.tsx` handles unexpected runtime failures without exposing internal error details.
- Authentication failures redirect to sign in; they are not presented as missing resources.
- Authenticated users without administrator access redirect to public vocabulary; route names do
  not replace server-side authorization checks.
