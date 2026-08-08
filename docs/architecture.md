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

## Application flow

- Public search and flashcard queries always filter on `is_public = true`.
- Administrator list and detail queries operate on the complete global dictionary and never filter
  by an administrator ID.
- Creating an entry sets both audit fields to the current administrator ID.
- Updating an entry leaves `created_by` unchanged and sets `updated_by` to the current
  administrator ID.
- Word images are stored in Supabase Storage and referenced by the dictionary entry.
