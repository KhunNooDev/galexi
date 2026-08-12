import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { anonRole, authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase';

import { PROFILE_LIMITS } from '@/constants/profile';
import { USER_ROLE } from '@/constants/role';
import { WORD_LIMITS } from '@/constants/word';

export const appRole = pgEnum('app_role', [USER_ROLE.MEMBER, USER_ROLE.ADMIN]);
const isPermanentAuthUser = sql`(((select auth.jwt()) ->> 'is_anonymous')::boolean) is false`;

// Authorization state only: this table controls what a user is allowed to do.
export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    role: appRole('role').default(USER_ROLE.MEMBER).notNull(),
  },
  (table) => [
    pgPolicy('Users can view their own role', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${authUid} = ${table.userId} and ${isPermanentAuthUser}`,
    }),
  ],
).enableRLS();

// Application identity only: never use profile fields for authorization decisions.
export const profiles = pgTable(
  'profiles',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    displayName: varchar('display_name', { length: PROFILE_LIMITS.DISPLAY_NAME_MAX_LENGTH })
      .default('')
      .notNull(),
    avatarUrl: varchar('avatar_url', { length: PROFILE_LIMITS.AVATAR_URL_MAX_LENGTH })
      .default('')
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    pgPolicy('Users can view their own profile', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${authUid} = ${table.userId} and ${isPermanentAuthUser}`,
    }),
    pgPolicy('Users can update their own profile', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${authUid} = ${table.userId} and ${isPermanentAuthUser}`,
      withCheck: sql`${authUid} = ${table.userId} and ${isPermanentAuthUser}`,
    }),
  ],
).enableRLS();

export const words = pgTable(
  'words',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    createdBy: uuid('created_by').references(() => authUsers.id, {
      onDelete: 'set null',
    }),
    updatedBy: uuid('updated_by').references(() => authUsers.id, {
      onDelete: 'set null',
    }),
    word: varchar('word', { length: WORD_LIMITS.WORD_MAX_LENGTH }).notNull(),
    pronunciationIpa: varchar('pronunciation_ipa', {
      length: WORD_LIMITS.PRONUNCIATION_MAX_LENGTH,
    })
      .default('')
      .notNull(),
    pronunciationThai: varchar('pronunciation_thai', {
      length: WORD_LIMITS.PRONUNCIATION_MAX_LENGTH,
    })
      .default('')
      .notNull(),
    partOfSpeech: varchar('part_of_speech', {
      length: WORD_LIMITS.PART_OF_SPEECH_MAX_LENGTH,
    })
      .default('')
      .notNull(),
    meaningsTh: text('meanings_th')
      .array()
      .default(sql`ARRAY[]::text[]`)
      .notNull(),
    exampleSentence: text('example_sentence').default('').notNull(),
    exampleSentenceMeaningTh: text('example_sentence_meaning_th').default('').notNull(),
    imageUrl: text('image_url').default('').notNull(),
    isPublic: boolean('is_public').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('words_created_at_idx').on(table.createdAt, table.id),
    index('words_created_by_idx').on(table.createdBy),
    index('words_updated_by_idx').on(table.updatedBy),
    index('words_public_word_idx')
      .on(sql`lower(${table.word})`, table.partOfSpeech, table.id)
      .where(sql`${table.isPublic} = true`),
    uniqueIndex('words_word_part_unique').on(
      sql`lower(${table.word})`,
      sql`lower(${table.partOfSpeech})`,
    ),
    pgPolicy('Admins can manage words', {
      for: 'all',
      to: authenticatedRole,
      using: sql`exists (select 1 from ${userRoles} where ${userRoles.userId} = ${authUid} and ${userRoles.role} = 'admin'::app_role)`,
      withCheck: sql`exists (select 1 from ${userRoles} where ${userRoles.userId} = ${authUid} and ${userRoles.role} = 'admin'::app_role)`,
    }),
    pgPolicy('Public can view published words', {
      for: 'select',
      to: [anonRole, authenticatedRole],
      using: sql`${table.isPublic} = true`,
    }),
  ],
).enableRLS();

export const categories = pgTable(
  'categories',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: varchar('name', { length: 80 }).notNull(),
    slug: varchar('slug', { length: 80 }).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('categories_slug_unique').on(sql`lower(${table.slug})`),
    index('categories_sort_order_idx').on(table.sortOrder, table.name),
    pgPolicy('Admins can manage categories', {
      for: 'all',
      to: authenticatedRole,
      using: sql`exists (select 1 from ${userRoles} where ${userRoles.userId} = ${authUid} and ${userRoles.role} = 'admin'::app_role)`,
      withCheck: sql`exists (select 1 from ${userRoles} where ${userRoles.userId} = ${authUid} and ${userRoles.role} = 'admin'::app_role)`,
    }),
    pgPolicy('Public can view categories for published words', {
      for: 'select',
      to: [anonRole, authenticatedRole],
      using: sql`exists (select 1 from word_categories wc join words w on w.id = wc.word_id where wc.category_id = ${table.id} and w.is_public = true)`,
    }),
  ],
).enableRLS();

export const wordCategories = pgTable(
  'word_categories',
  {
    wordId: integer('word_id')
      .notNull()
      .references(() => words.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.wordId, table.categoryId] }),
    index('word_categories_category_id_idx').on(table.categoryId, table.wordId),
    pgPolicy('Admins can manage word categories', {
      for: 'all',
      to: authenticatedRole,
      using: sql`exists (select 1 from ${userRoles} where ${userRoles.userId} = ${authUid} and ${userRoles.role} = 'admin'::app_role)`,
      withCheck: sql`exists (select 1 from ${userRoles} where ${userRoles.userId} = ${authUid} and ${userRoles.role} = 'admin'::app_role)`,
    }),
    pgPolicy('Public can view categories for published words', {
      for: 'select',
      to: [anonRole, authenticatedRole],
      using: sql`exists (select 1 from ${words} where ${words.id} = ${table.wordId} and ${words.isPublic} = true)`,
    }),
  ],
).enableRLS();

export type NewWord = typeof words.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
