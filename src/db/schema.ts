import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { anonRole, authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase';

import { USER_ROLE } from '@/constants/role';
import { WORD_LIMITS } from '@/constants/word';

export const appRole = pgEnum('app_role', [USER_ROLE.MEMBER, USER_ROLE.ADMIN]);

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
      using: sql`${authUid} = ${table.userId}`,
    }),
  ],
).enableRLS();

export const words = pgTable(
  'words',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, {
        onDelete: 'cascade',
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
    index('words_user_created_idx').on(table.userId, table.createdAt, table.id),
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

export type NewWord = typeof words.$inferInsert;
