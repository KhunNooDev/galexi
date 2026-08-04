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

| Actor         | Public entries | Unpublished entries | Create, update, publish, delete |
| ------------- | -------------- | ------------------- | ------------------------------- |
| Guest         | Read           | No access           | No access                       |
| Member        | Read           | No access           | No access                       |
| Administrator | Read           | Read                | Allowed                         |

Row-level security mirrors this model: anonymous and authenticated users can select published rows,
while the administrator policy permits full management based on `user_roles`. Hono mutation routes
also require the administrator role before calling the dictionary server functions.

## Application flow

- Public search and flashcard queries always filter on `is_public = true`.
- Administrator list and detail queries operate on the complete global dictionary and never filter
  by an administrator ID.
- Creating an entry sets both audit fields to the current administrator ID.
- Updating an entry leaves `created_by` unchanged and sets `updated_by` to the current
  administrator ID.
- Word images are stored in Supabase Storage and referenced by the dictionary entry.
