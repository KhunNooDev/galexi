'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowDown,
  ArrowUp,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
  X,
} from 'lucide-react';

import { AlertDialog } from '@/components/alert-dialog';
import { Dialog } from '@/components/dialog';
import { createFormInputs, Form } from '@/components/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  const [searchInput, setSearchInput] = useState('');
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

  function renderCategoryActions(category: AdminCategory, index: number) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='shrink-0 cursor-pointer rounded-xl text-muted-foreground hover:bg-secondary-hover hover:text-foreground'
            aria-label={t('categories.manager.actions', { name: category.name })}
          >
            <MoreVertical aria-hidden='true' className='size-5' />
          </Button>
        </PopoverTrigger>
        <PopoverContent align='end' sideOffset={6} className='w-56 p-2'>
          <Button
            type='button'
            variant='ghost'
            className='h-10 w-full cursor-pointer justify-start rounded-lg px-3 text-surface-foreground hover:bg-secondary-hover'
            disabled={isFiltering || index === 0 || reorderMutation.isPending}
            onClick={() => move(category, -1)}
          >
            <ArrowUp aria-hidden='true' className='size-4 text-muted-foreground' />
            {t('categories.manager.moveUp', { name: category.name })}
          </Button>
          <Button
            type='button'
            variant='ghost'
            className='h-10 w-full cursor-pointer justify-start rounded-lg px-3 text-surface-foreground hover:bg-secondary-hover'
            disabled={isFiltering || index === categories.length - 1 || reorderMutation.isPending}
            onClick={() => move(category, 1)}
          >
            <ArrowDown aria-hidden='true' className='size-4 text-muted-foreground' />
            {t('categories.manager.moveDown', { name: category.name })}
          </Button>
          <Button
            type='button'
            variant='ghost'
            className='h-10 w-full cursor-pointer justify-start rounded-lg px-3 text-surface-foreground hover:bg-secondary-hover'
            onClick={() => openEdit(category)}
          >
            <Pencil aria-hidden='true' className='size-4 text-muted-foreground' />
            {t('categories.manager.edit', { name: category.name })}
          </Button>
          <div className='my-1 h-px bg-border' />
          <Button
            type='button'
            variant='ghost'
            className='h-10 w-full cursor-pointer justify-start rounded-lg px-3 text-danger hover:bg-danger/10 hover:text-danger'
            onClick={() => setDeleting(category)}
          >
            <Trash2 aria-hidden='true' className='size-4' />
            {t('categories.manager.delete', { name: category.name })}
          </Button>
        </PopoverContent>
      </Popover>
    );
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
      <div className='galexi-toolbar space-y-4 p-4 sm:p-5'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex min-w-0 items-center gap-3'>
            <span className='inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
              <Tags aria-hidden='true' className='size-5' />
            </span>
            <div className='min-w-0'>
              <h1
                id='category-manager-title'
                className='truncate text-xl font-semibold text-surface-foreground'
              >
                {t('categories.manager.title')}
              </h1>
              <p className='mt-0.5 text-sm text-muted-foreground'>
                {t('categories.manager.resultCount', { count: filtered.length })}
              </p>
            </div>
          </div>
          <Button
            type='button'
            className='h-11 cursor-pointer rounded-xl bg-primary px-4 text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover'
            onClick={openCreate}
          >
            <Plus aria-hidden='true' className='size-4' />
            {t('categories.manager.add')}
          </Button>
        </div>

        <form
          className='flex items-center gap-2'
          role='search'
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(searchInput);
          }}
        >
          <label className='relative min-w-0 flex-1'>
            <span className='sr-only'>{t('categories.manager.searchLabel')}</span>
            <Search
              aria-hidden='true'
              className='pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground'
            />
            <Input
              type='search'
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t('categories.manager.searchPlaceholder')}
              className='h-12 w-full rounded-2xl border border-border bg-field pr-4 pl-12 text-sm text-surface-foreground shadow-xs outline-none placeholder:text-muted-foreground focus:border-focus focus:ring-2 focus:ring-focus/20 dark:bg-field'
            />
          </label>
          <Button
            type='submit'
            size='icon-lg'
            className='size-12 cursor-pointer rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary-hover'
            aria-label={t('categories.manager.searchAction')}
          >
            <Search aria-hidden='true' className='size-5' />
          </Button>
        </form>
      </div>

      {filtered.length === 0 ? (
        <p className='galexi-empty mt-4'>
          {query ? t('categories.manager.noResults') : t('categories.manager.empty')}
        </p>
      ) : (
        <ul className='mt-4 grid gap-4 lg:grid-cols-2'>
          {filtered.map((category) => {
            const index = categories.findIndex((item) => item.id === category.id);
            return (
              <li
                key={category.id}
                className='group flex min-h-44 gap-4 rounded-3xl border border-border bg-surface p-4 shadow-[0_16px_45px_rgb(34_74_150/7%)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/8 sm:p-5'
              >
                <span className='inline-flex size-20 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-secondary-hover text-primary sm:size-24'>
                  <Tags aria-hidden='true' className='size-7' />
                </span>
                <div className='flex min-w-0 flex-1 flex-col'>
                  <div className='flex items-start gap-2'>
                    <div className='min-w-0 flex-1'>
                      <h2 className='text-lg font-semibold wrap-break-word text-surface-foreground sm:text-xl'>
                        {category.name}
                      </h2>
                      <p className='mt-1 text-sm text-muted-foreground'>/{category.slug}</p>
                    </div>
                    {renderCategoryActions(category, index)}
                  </div>
                  <Badge
                    variant='secondary'
                    className='mt-4 w-fit bg-primary/10 px-2.5 py-1 text-primary'
                  >
                    {t('categories.wordCount', { count: category.wordCount })}
                  </Badge>
                </div>
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
