'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, Pencil, Plus, Search, Trash2, X } from 'lucide-react';

import { AlertDialog } from '@/components/alert-dialog';
import { Dialog } from '@/components/dialog';
import { createFormInputs, Form } from '@/components/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminCategory } from '@/features/categories/category.api';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useReorderCategories,
  useUpdateCategory,
} from '@/features/categories/category.queries';
import {
  type CategoryFormInput,
  type CategoryFormValues,
  createCategoryFormSchema,
} from '@/features/categories/category.schema';
import { ApiError } from '@/lib/api/errors';

const { InputText } = createFormInputs<CategoryFormInput>();

export function CategoryManager({ initialCategories }: { initialCategories: AdminCategory[] }) {
  const t = useTranslations();
  const schema = useMemo(
    () =>
      createCategoryFormSchema({
        invalidSlug: t('categories.manager.validation.invalidSlug'),
        nameRequired: t('categories.manager.validation.nameRequired'),
        required: t('categories.manager.validation.required'),
        sortOrderInvalid: t('categories.manager.validation.sortOrderInvalid'),
        tooLong: t('categories.manager.validation.tooLong'),
      }),
    [t],
  );
  const categoriesQuery = useCategories(initialCategories);
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const reorderMutation = useReorderCategories();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const form = useForm<CategoryFormInput, unknown, CategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '', sortOrder: '0' },
  });
  const categories = categoriesQuery.data;
  const isFiltering = query.trim().length > 0;
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return normalizedQuery
      ? categories.filter((category) =>
          `${category.name} ${category.slug}`.toLocaleLowerCase().includes(normalizedQuery),
        )
      : categories;
  }, [categories, query]);

  function openCreate() {
    setEditing(null);
    form.reset({ name: '', slug: '', sortOrder: String(categories.length) });
    setDialogOpen(true);
  }

  function openEdit(category: AdminCategory) {
    setEditing(category);
    form.reset({ ...category, sortOrder: String(category.sortOrder) });
    setDialogOpen(true);
  }

  async function save(values: CategoryFormValues) {
    setRequestError(null);
    try {
      if (editing) await updateMutation.mutateAsync({ id: editing.id, values });
      else await createMutation.mutateAsync(values);
      setDialogOpen(false);
    } catch (error) {
      setRequestError(
        error instanceof ApiError && error.status === 409
          ? t('categories.manager.duplicateSlug')
          : t('categories.manager.requestError'),
      );
    }
  }

  function move(category: AdminCategory, direction: -1 | 1) {
    if (isFiltering) return;

    const index = categories.findIndex((item) => item.id === category.id);
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    setRequestError(null);
    void reorderMutation
      .mutateAsync(next.map((item) => item.id))
      .catch(() => setRequestError(t('categories.manager.requestError')));
  }

  return (
    <section aria-labelledby='category-manager-title'>
      {(requestError || categoriesQuery.error) && (
        <Alert variant='destructive' className='mb-5'>
          <AlertDescription>
            {requestError ?? t('categories.manager.requestError')}
          </AlertDescription>
        </Alert>
      )}
      <div className='flex flex-col gap-4 rounded-3xl border border-border bg-surface/80 p-5 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 id='category-manager-title' className='text-2xl font-semibold'>
            {t('categories.manager.title')}
          </h1>
          <p className='mt-1 text-sm text-muted-foreground'>{t('categories.manager.subtitle')}</p>
        </div>
        <Button className='h-11 rounded-full px-5' onClick={openCreate}>
          <Plus className='size-4' /> {t('categories.manager.add')}
        </Button>
      </div>

      <label className='relative mt-5 block'>
        <span className='sr-only'>{t('categories.manager.searchLabel')}</span>
        <Search className='pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('categories.manager.searchPlaceholder')}
          className='h-11 rounded-full bg-surface pl-10'
        />
      </label>

      {filtered.length === 0 ? (
        <p className='mt-5 rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground'>
          {query ? t('categories.manager.noResults') : t('categories.manager.empty')}
        </p>
      ) : (
        <ul className='mt-5 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-surface'>
          {filtered.map((category) => {
            const index = categories.findIndex((item) => item.id === category.id);
            return (
              <li key={category.id} className='flex flex-wrap items-center gap-3 p-4 sm:px-5'>
                <div className='min-w-0 flex-1'>
                  <p className='font-semibold'>{category.name}</p>
                  <p className='mt-0.5 text-sm text-muted-foreground'>/{category.slug}</p>
                </div>
                <Badge variant='secondary'>
                  {t('categories.wordCount', { count: category.wordCount })}
                </Badge>
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label={t('categories.manager.moveUp', { name: category.name })}
                  disabled={isFiltering || index === 0 || reorderMutation.isPending}
                  onClick={() => move(category, -1)}
                >
                  <ArrowUp className='size-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label={t('categories.manager.moveDown', { name: category.name })}
                  disabled={
                    isFiltering || index === categories.length - 1 || reorderMutation.isPending
                  }
                  onClick={() => move(category, 1)}
                >
                  <ArrowDown className='size-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label={t('categories.manager.edit', { name: category.name })}
                  onClick={() => openEdit(category)}
                >
                  <Pencil className='size-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='text-danger hover:bg-danger/10 hover:text-danger'
                  aria-label={t('categories.manager.delete', { name: category.name })}
                  onClick={() => setDeleting(category)}
                >
                  <Trash2 className='size-4' />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? t('categories.manager.editTitle') : t('categories.manager.createTitle')}
        closeLabel={t('categories.manager.close')}
        initialFocusId='name'
        size='sm'
      >
        <Form form={form} onSubmit={save} className='grid gap-5 p-5'>
          {requestError && (
            <Alert variant='destructive'>
              <AlertDescription>{requestError}</AlertDescription>
            </Alert>
          )}
          <InputText field='name' label={t('categories.manager.name')} required />
          <InputText
            field='slug'
            label={t('categories.manager.slug')}
            hint={t('categories.manager.slugHint')}
            required
          />
          <InputText
            field='sortOrder'
            label={t('categories.manager.sortOrder')}
            type='number'
            required
          />
          <div className='flex justify-end gap-3'>
            <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>
              <X className='size-4' />
              {t('categories.manager.cancel')}
            </Button>
            <Button type='submit' disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? t('categories.manager.save') : t('categories.manager.add')}
            </Button>
          </div>
        </Form>
      </Dialog>

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        icon={<Trash2 className='size-5' />}
        title={t('categories.manager.deleteTitle')}
        description={t('categories.manager.deleteDescription', { name: deleting?.name ?? '' })}
        cancelLabel={t('categories.manager.cancel')}
        actionLabel={t('categories.manager.confirmDelete')}
        actionVariant='destructive'
        tone='danger'
        pending={deleteMutation.isPending}
        closeOnAction={false}
        onAction={() => {
          if (!deleting) return;
          setRequestError(null);
          void deleteMutation
            .mutateAsync(deleting.id)
            .then(() => setDeleting(null))
            .catch(() => setRequestError(t('categories.manager.requestError')));
        }}
      />
    </section>
  );
}
