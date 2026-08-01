import { zValidator } from '@hono/zod-validator';
import { and, desc, eq } from 'drizzle-orm';
import type { MiddlewareHandler } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';

import { API_PATH } from '@/constants/api';
import { TASK_LIMITS } from '@/constants/task';
import { getDatabase } from '@/db';
import { tasks } from '@/db/schema';
import { getCurrentUserId } from '@/lib/supabase/auth';

const taskInputSchema = z.object({
  title: z.string().trim().min(1).max(TASK_LIMITS.TITLE_MAX_LENGTH),
  description: z.string().trim().max(TASK_LIMITS.DESCRIPTION_MAX_LENGTH),
});

const taskIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const taskColumns = {
  id: tasks.id,
  title: tasks.title,
  description: tasks.description,
};

type ApiEnvironment = {
  Variables: {
    userId: string;
  };
};

const requireAuthentication: MiddlewareHandler<ApiEnvironment> = async (
  context,
  next,
) => {
  const userId = await getCurrentUserId();

  if (!userId) {
    return context.json({ error: 'Unauthorized' }, 401);
  }

  context.set('userId', userId);
  await next();
};

export const api = new Hono<ApiEnvironment>()
  .basePath(API_PATH.BASE)
  .use(API_PATH.TASKS, requireAuthentication)
  .use(API_PATH.TASKS_WILDCARD, requireAuthentication)
  .get(API_PATH.TASKS, async (context) => {
    const userId = context.get('userId');
    const taskList = await getDatabase()
      .select(taskColumns)
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt), desc(tasks.id));

    return context.json({ tasks: taskList }, 200);
  })
  .post(
    API_PATH.TASKS,
    zValidator('json', taskInputSchema),
    async (context) => {
      const userId = context.get('userId');
      const [task] = await getDatabase()
        .insert(tasks)
        .values({ ...context.req.valid('json'), userId })
        .returning(taskColumns);

      return context.json({ task }, 201);
    },
  )
  .patch(
    API_PATH.TASK_BY_ID,
    zValidator('param', taskIdSchema),
    zValidator('json', taskInputSchema),
    async (context) => {
      const { id } = context.req.valid('param');
      const [task] = await getDatabase()
        .update(tasks)
        .set(context.req.valid('json'))
        .where(and(eq(tasks.id, id), eq(tasks.userId, context.get('userId'))))
        .returning(taskColumns);

      if (!task) {
        return context.json({ error: 'Task not found' }, 404);
      }

      return context.json({ task }, 200);
    },
  )
  .delete(
    API_PATH.TASK_BY_ID,
    zValidator('param', taskIdSchema),
    async (context) => {
      const { id } = context.req.valid('param');
      const [deletedTask] = await getDatabase()
        .delete(tasks)
        .where(and(eq(tasks.id, id), eq(tasks.userId, context.get('userId'))))
        .returning({ id: tasks.id });

      if (!deletedTask) {
        return context.json({ error: 'Task not found' }, 404);
      }

      return context.json(deletedTask, 200);
    },
  )
  .onError((error, context) => {
    console.error(error);
    return context.json({ error: 'Internal server error' }, 500);
  });

export type ApiType = typeof api;
