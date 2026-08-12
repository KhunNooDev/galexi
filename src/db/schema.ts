import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  jsonb,
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
import {
  LEARNING_GOAL,
  LEARNING_LEVEL,
  LEARNING_LIMITS,
  LEARNING_SESSION_STATUS,
} from '@/features/learning/learning.constants';

export const appRole = pgEnum('app_role', [USER_ROLE.MEMBER, USER_ROLE.ADMIN]);
export const learningGoal = pgEnum('learning_goal', [
  LEARNING_GOAL.DAILY_CONVERSATION,
  LEARNING_GOAL.TRAVEL,
  LEARNING_GOAL.WORK,
  LEARNING_GOAL.SCHOOL_EXAM,
]);
export const learningLevel = pgEnum('learning_level', [
  LEARNING_LEVEL.STARTER,
  LEARNING_LEVEL.BEGINNER,
  LEARNING_LEVEL.INTERMEDIATE,
  LEARNING_LEVEL.ADVANCED,
]);
export const learningSessionStatus = pgEnum('learning_session_status', [
  LEARNING_SESSION_STATUS.IN_PROGRESS,
  LEARNING_SESSION_STATUS.COMPLETED,
  LEARNING_SESSION_STATUS.ABANDONED,
]);
const isPermanentAuthUser = sql`(((select auth.jwt()) ->> 'is_anonymous')::boolean) is false`;
const isRowOwner = (userId: AnyPgColumn) => sql`${authUid} = ${userId}`;

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

const isLearningWordVisible = (wordId: AnyPgColumn) => sql`exists (
  select 1
  from ${words}
  where ${words.id} = ${wordId}
    and (
      ${words.isPublic} = true
      or exists (
        select 1
        from ${userRoles}
        where ${userRoles.userId} = ${authUid}
          and ${userRoles.role} = 'admin'::app_role
      )
    )
)`;

// Learning data belongs to an Auth user, whether the identity is guest or permanent.
export const learningProfiles = pgTable(
  'learning_profiles',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    goal: learningGoal('goal'),
    level: learningLevel('level'),
    onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    pgPolicy('Users can view their own learning profile', {
      for: 'select',
      to: authenticatedRole,
      using: isRowOwner(table.userId),
    }),
    pgPolicy('Users can create their own learning profile', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: isRowOwner(table.userId),
    }),
    pgPolicy('Users can update their own learning profile', {
      for: 'update',
      to: authenticatedRole,
      using: isRowOwner(table.userId),
      withCheck: isRowOwner(table.userId),
    }),
  ],
).enableRLS();

export const learningSessions = pgTable(
  'learning_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    lessonKey: varchar('lesson_key', { length: LEARNING_LIMITS.LESSON_KEY_MAX_LENGTH }).notNull(),
    status: learningSessionStatus('status').default(LEARNING_SESSION_STATUS.IN_PROGRESS).notNull(),
    currentStep: integer('current_step').default(0).notNull(),
    state: jsonb('state').$type<Record<string, unknown>>().default({}).notNull(),
    score: integer('score'),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    check('learning_sessions_lesson_key_check', sql`length(btrim(${table.lessonKey})) > 0`),
    check('learning_sessions_current_step_check', sql`${table.currentStep} >= 0`),
    check(
      'learning_sessions_score_check',
      sql`${table.score} is null or (${table.score} >= 0 and ${table.score} <= ${sql.raw(String(LEARNING_LIMITS.SCORE_MAX))})`,
    ),
    check(
      'learning_sessions_completion_check',
      sql`(${table.status} = ${sql.raw(`'${LEARNING_SESSION_STATUS.COMPLETED}'`)} and ${table.completedAt} is not null) or (${table.status} <> ${sql.raw(`'${LEARNING_SESSION_STATUS.COMPLETED}'`)} and ${table.completedAt} is null)`,
    ),
    check(
      'learning_sessions_state_size_check',
      sql`pg_column_size(${table.state}) <= ${sql.raw(String(LEARNING_LIMITS.SESSION_STATE_MAX_BYTES))}`,
    ),
    check('learning_sessions_state_type_check', sql`jsonb_typeof(${table.state}) = 'object'`),
    index('learning_sessions_user_status_updated_idx').on(
      table.userId,
      table.status,
      table.updatedAt.desc(),
    ),
    index('learning_sessions_user_started_idx').on(table.userId, table.startedAt.desc()),
    pgPolicy('Users can view their own learning sessions', {
      for: 'select',
      to: authenticatedRole,
      using: isRowOwner(table.userId),
    }),
    pgPolicy('Users can create their own learning sessions', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: isRowOwner(table.userId),
    }),
    pgPolicy('Users can update their own learning sessions', {
      for: 'update',
      to: authenticatedRole,
      using: isRowOwner(table.userId),
      withCheck: isRowOwner(table.userId),
    }),
  ],
).enableRLS();

export const userWordProgress = pgTable(
  'user_word_progress',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    wordId: integer('word_id')
      .notNull()
      .references(() => words.id, { onDelete: 'cascade' }),
    seenCount: integer('seen_count').default(0).notNull(),
    correctCount: integer('correct_count').default(0).notNull(),
    incorrectCount: integer('incorrect_count').default(0).notNull(),
    mastery: integer('mastery').default(0).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.wordId] }),
    check('user_word_progress_seen_count_check', sql`${table.seenCount} >= 0`),
    check('user_word_progress_correct_count_check', sql`${table.correctCount} >= 0`),
    check('user_word_progress_incorrect_count_check', sql`${table.incorrectCount} >= 0`),
    check(
      'user_word_progress_mastery_check',
      sql`${table.mastery} >= 0 and ${table.mastery} <= ${sql.raw(String(LEARNING_LIMITS.MASTERY_MAX))}`,
    ),
    index('user_word_progress_word_id_idx').on(table.wordId),
    index('user_word_progress_user_last_seen_idx').on(table.userId, table.lastSeenAt.desc()),
    pgPolicy('Users can view their own word progress', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${isRowOwner(table.userId)} and ${isLearningWordVisible(table.wordId)}`,
    }),
    pgPolicy('Users can create their own word progress', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${isRowOwner(table.userId)} and ${isLearningWordVisible(table.wordId)}`,
    }),
    pgPolicy('Users can update their own word progress', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${isRowOwner(table.userId)} and ${isLearningWordVisible(table.wordId)}`,
      withCheck: sql`${isRowOwner(table.userId)} and ${isLearningWordVisible(table.wordId)}`,
    }),
  ],
).enableRLS();

export type NewWord = typeof words.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
