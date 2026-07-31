import { zValidator } from '@hono/zod-validator';
import { desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { getDatabase } from '@/db';
import { tasks } from '@/db/schema';

const taskInputSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(200),
});

const taskIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const taskColumns = {
  id: tasks.id,
  title: tasks.title,
  description: tasks.description,
};

export const api = new Hono()
  .basePath('/api')
  .get('/health', (context) =>
    context.json({
      status: 'ok',
    }),
  )
  .get('/tasks', async (context) => {
    const taskList = await getDatabase()
      .select(taskColumns)
      .from(tasks)
      .orderBy(desc(tasks.createdAt), desc(tasks.id));

    return context.json({ tasks: taskList }, 200);
  })
  .post('/tasks', zValidator('json', taskInputSchema), async (context) => {
    const [task] = await getDatabase()
      .insert(tasks)
      .values(context.req.valid('json'))
      .returning(taskColumns);

    return context.json({ task }, 201);
  })
  .patch(
    '/tasks/:id',
    zValidator('param', taskIdSchema),
    zValidator('json', taskInputSchema),
    async (context) => {
      const { id } = context.req.valid('param');
      const [task] = await getDatabase()
        .update(tasks)
        .set(context.req.valid('json'))
        .where(eq(tasks.id, id))
        .returning(taskColumns);

      if (!task) {
        return context.json({ error: 'Task not found' }, 404);
      }

      return context.json({ task }, 200);
    },
  )
  .delete('/tasks/:id', zValidator('param', taskIdSchema), async (context) => {
    const { id } = context.req.valid('param');
    const [deletedTask] = await getDatabase()
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning({ id: tasks.id });

    if (!deletedTask) {
      return context.json({ error: 'Task not found' }, 404);
    }

    return context.json(deletedTask, 200);
  })
  .onError((error, context) => {
    console.error(error);
    return context.json({ error: 'Internal server error' }, 500);
  });

export type ApiType = typeof api;
