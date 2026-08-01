'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { hc } from 'hono/client';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { z } from 'zod';

import type { ApiType } from '@/server/api';

const client = hc<ApiType>('/');

type TaskLabels = {
  titleLabel: string;
  titlePlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  create: string;
  update: string;
  cancel: string;
  listTitle: string;
  empty: string;
  edit: string;
  delete: string;
  titleRequired: string;
  titleTooLong: string;
  descriptionTooLong: string;
  loading: string;
  loadError: string;
  requestError: string;
};

type Task = {
  id: number;
  title: string;
  description: string;
};

function createTaskSchema(labels: TaskLabels) {
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, labels.titleRequired)
      .max(80, labels.titleTooLong),
    description: z.string().trim().max(200, labels.descriptionTooLong),
  });
}

type TaskFormValues = z.infer<ReturnType<typeof createTaskSchema>>;

export function TaskManager() {
  const t = useTranslations('tasks.manager');
  const labels = useMemo<TaskLabels>(
    () => ({
      titleLabel: t('titleLabel'),
      titlePlaceholder: t('titlePlaceholder'),
      descriptionLabel: t('descriptionLabel'),
      descriptionPlaceholder: t('descriptionPlaceholder'),
      create: t('create'),
      update: t('update'),
      cancel: t('cancel'),
      listTitle: t('listTitle'),
      empty: t('empty'),
      edit: t('edit'),
      delete: t('delete'),
      titleRequired: t('titleRequired'),
      titleTooLong: t('titleTooLong'),
      descriptionTooLong: t('descriptionTooLong'),
      loading: t('loading'),
      loadError: t('loadError'),
      requestError: t('requestError'),
    }),
    [t],
  );
  const schema = useMemo(() => createTaskSchema(labels), [labels]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  useEffect(() => {
    let ignore = false;

    async function loadTasks() {
      try {
        const response = await client.api.tasks.$get();

        if (response.status !== 200) {
          throw new Error('Unable to load tasks');
        }

        const data = await response.json();

        if (!ignore) {
          setTasks(data.tasks);
        }
      } catch {
        if (!ignore) {
          setRequestError(labels.loadError);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadTasks();

    return () => {
      ignore = true;
    };
  }, [labels.loadError]);

  function resetForm() {
    setEditingId(null);
    reset({ title: '', description: '' });
  }

  async function saveTask(values: TaskFormValues) {
    setRequestError(null);

    try {
      if (editingId !== null) {
        const response = await client.api.tasks[':id'].$patch({
          param: { id: String(editingId) },
          json: values,
        });

        if (response.status !== 200) {
          throw new Error('Unable to update task');
        }

        const data = await response.json();
        setTasks((current) =>
          current.map((task) => (task.id === editingId ? data.task : task)),
        );
        resetForm();
        return;
      }

      const response = await client.api.tasks.$post({ json: values });

      if (response.status !== 201) {
        throw new Error('Unable to create task');
      }

      const data = await response.json();
      setTasks((current) => [...current, data.task]);
      resetForm();
    } catch {
      setRequestError(labels.requestError);
    }
  }

  function editTask(task: Task) {
    setEditingId(task.id);
    reset({ title: task.title, description: task.description });
  }

  async function deleteTask(id: number) {
    setDeletingId(id);
    setRequestError(null);

    try {
      const response = await client.api.tasks[':id'].$delete({
        param: { id: String(id) },
      });

      if (response.status !== 200) {
        throw new Error('Unable to delete task');
      }

      setTasks((current) => current.filter((task) => task.id !== id));

      if (editingId === id) {
        resetForm();
      }
    } catch {
      setRequestError(labels.requestError);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className='space-y-4'>
      {requestError && (
        <p
          className='rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger'
          role='alert'
        >
          {requestError}
        </p>
      )}

      <div className='grid gap-8 md:grid-cols-2'>
        <form
          className='h-fit space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-sm'
          onSubmit={handleSubmit(saveTask)}
        >
          <div className='space-y-2'>
            <label
              className='text-sm font-medium text-surface-foreground'
              htmlFor='task-title'
            >
              {labels.titleLabel}
            </label>
            <input
              id='task-title'
              className='h-11 w-full rounded-lg border border-border bg-background px-3 text-surface-foreground outline-none placeholder:text-muted-foreground focus:border-focus focus:ring-2 focus:ring-focus/20'
              placeholder={labels.titlePlaceholder}
              maxLength={80}
              aria-invalid={Boolean(errors.title)}
              {...register('title')}
            />
            {errors.title && (
              <p className='text-sm text-danger'>{errors.title.message}</p>
            )}
          </div>

          <div className='space-y-2'>
            <label
              className='text-sm font-medium text-surface-foreground'
              htmlFor='task-description'
            >
              {labels.descriptionLabel}
            </label>
            <textarea
              id='task-description'
              className='min-h-28 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-surface-foreground outline-none placeholder:text-muted-foreground focus:border-focus focus:ring-2 focus:ring-focus/20'
              placeholder={labels.descriptionPlaceholder}
              maxLength={200}
              aria-invalid={Boolean(errors.description)}
              {...register('description')}
            />
            {errors.description && (
              <p className='text-sm text-danger'>
                {errors.description.message}
              </p>
            )}
          </div>

          <div className='flex flex-wrap gap-3'>
            <button
              type='submit'
              className='inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-wait disabled:opacity-60'
              disabled={isSubmitting}
            >
              {editingId === null ? (
                <Plus aria-hidden='true' className='size-4' />
              ) : (
                <Save aria-hidden='true' className='size-4' />
              )}
              {editingId === null ? labels.create : labels.update}
            </button>
            {editingId !== null && (
              <button
                type='button'
                className='inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 font-medium transition-colors hover:bg-secondary-hover'
                onClick={resetForm}
              >
                <X aria-hidden='true' className='size-4' />
                {labels.cancel}
              </button>
            )}
          </div>
        </form>

        <section className='space-y-4' aria-labelledby='task-list-title'>
          <div className='flex items-center justify-between'>
            <h2
              id='task-list-title'
              className='text-xl font-semibold text-surface-foreground'
            >
              {labels.listTitle}
            </h2>
            <span className='rounded-full bg-secondary-hover px-3 py-1 text-sm text-muted-foreground'>
              {tasks.length}
            </span>
          </div>

          {isLoading ? (
            <p className='rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground'>
              {labels.loading}
            </p>
          ) : tasks.length === 0 ? (
            <p className='rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground'>
              {labels.empty}
            </p>
          ) : (
            <ul className='space-y-3'>
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className='flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm'
                >
                  <div className='min-w-0 flex-1'>
                    <h3 className='font-semibold wrap-break-word text-surface-foreground'>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className='mt-1 text-sm leading-6 wrap-break-word text-muted-foreground'>
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className='flex shrink-0 gap-1'>
                    <button
                      type='button'
                      className='inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary-hover hover:text-surface-foreground'
                      aria-label={`${labels.edit}: ${task.title}`}
                      title={labels.edit}
                      onClick={() => editTask(task)}
                    >
                      <Pencil aria-hidden='true' className='size-4' />
                    </button>
                    <button
                      type='button'
                      className='inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-danger transition-colors hover:bg-danger hover:text-danger-foreground disabled:cursor-wait disabled:opacity-60'
                      aria-label={`${labels.delete}: ${task.title}`}
                      title={labels.delete}
                      disabled={deletingId === task.id}
                      onClick={() => void deleteTask(task.id)}
                    >
                      <Trash2 aria-hidden='true' className='size-4' />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
