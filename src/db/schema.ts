import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase';

import { TASK_LIMITS } from '@/constants/task';

export const tasks = pgTable(
  'tasks',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, {
        onDelete: 'cascade',
      }),
    title: varchar('title', { length: TASK_LIMITS.TITLE_MAX_LENGTH }).notNull(),
    description: text('description').default('').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('tasks_user_created_idx').on(table.userId, table.createdAt, table.id),
    pgPolicy('Users can manage their own tasks', {
      for: 'all',
      to: authenticatedRole,
      using: sql`${authUid} = ${table.userId}`,
      withCheck: sql`${authUid} = ${table.userId}`,
    }),
  ],
).enableRLS();

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
