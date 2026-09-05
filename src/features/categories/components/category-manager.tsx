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
import { FetchingContent } from '@/components/fetching-content';
import { createFormInputs, Form } from '@/components/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { AdminCategory, AdminCategoryPage } from '@/features/categories/category.api';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useMoveCategory,
  useUpdateCategory,
} from '@/features/categories/category.queries';
import {
  type CategoryFormInput,
  type CategoryFormValues,
  createCategoryFormSchema,
} from '@/features/categories/category.schema';
import type { CategoryListParams } from '@/features/categories/category-list';
import { WordPagination, type WordView } from '@/features/words/components/word-pagination';
import { ApiError } from '@/lib/api/errors';
import { cn } from '@/lib/utils';

const { InputText } = createFormInputs<CategoryFormInput>();

export function CategoryManager({ initialPage }: { initialPage: AdminCategoryPage }) {
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
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [view, setView] = useState<WordView>('grid');
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const listParams = useMemo<CategoryListParams>(
    () => ({ page: currentPage, pageSize, query }),
    [currentPage, pageSize, query],
  );
  const categoriesQuery = useCategories(initialPage, listParams);
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const moveMutation = useMoveCategory();
  const form = useForm<CategoryFormInput, unknown, CategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '', sortOrder: '0' },
  });
  const page = categoriesQuery.data ?? {
    categories: [],
    nextSortOrder: initialPage.nextSortOrder,
    page: currentPage,
    total: 0,
  };
  const categories = page.categories;
  const isFiltering = query.trim().length > 0;
  const totalPages = Math.max(1, Math.ceil(page.total / pageSize));
  const loadedPage = Number.isFinite(page.page) ? page.page : currentPage;
  const activePage = Math.min(loadedPage, totalPages);

  function openCreate() {
    setEditing(null);
    form.reset({ name: '', slug: '', sortOrder: String(page.nextSortOrder) });
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
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, values });
      } else {
        await createMutation.mutateAsync(values);
      }
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

    setRequestError(null);
    void moveMutation
      .mutateAsync({ id: category.id, direction })
      .catch(() => setRequestError(t('categories.manager.requestError')));
  }

  function renderCategoryActions(category: AdminCategory, index: number) {
    const absoluteIndex = (activePage - 1) * pageSize + index;

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
            disabled={isFiltering || absoluteIndex === 0 || moveMutation.isPending}
            onClick={() => move(category, -1)}
          >
            <ArrowUp aria-hidden='true' className='size-4 text-muted-foreground' />
            {t('categories.manager.moveUp', { name: category.name })}
          </Button>
          <Button
            type='button'
            variant='ghost'
            className='h-10 w-full cursor-pointer justify-start rounded-lg px-3 text-surface-foreground hover:bg-secondary-hover'
            disabled={isFiltering || absoluteIndex === page.total - 1 || moveMutation.isPending}
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
                {t('categories.manager.resultCount', { count: page.total })}
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
            setCurrentPage(1);
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

      {page.total > 0 && (
        <div className='mt-4'>
          <WordPagination
            pending={categoriesQuery.isFetching}
            kind='categories'
            activePage={activePage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalResults={page.total}
            view={view}
            onPageChange={setCurrentPage}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setCurrentPage(1);
            }}
            onViewChange={setView}
          />
        </div>
      )}

      <div className='mt-4'>
        <FetchingContent
          fetching={categoriesQuery.isFetching}
          stale={categoriesQuery.isPlaceholderData}
          label={t('boundaries.adminUpdating')}
        >
          {categories.length === 0 ? (
            <p className='galexi-empty'>
              {query ? t('categories.manager.noResults') : t('categories.manager.empty')}
            </p>
          ) : (
            <ul className={cn('grid gap-4', view === 'grid' && 'lg:grid-cols-2')}>
              {categories.map((category, index) => {
                return (
                  <li
                    key={category.id}
                    className={cn(
                      'group flex border border-border bg-surface shadow-[0_16px_45px_rgb(34_74_150/7%)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/8',
                      view === 'grid'
                        ? 'min-h-28 gap-3 rounded-3xl p-3 sm:p-4'
                        : 'items-center gap-3 rounded-2xl px-3 py-2.5 sm:px-4',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-secondary-hover text-primary',
                        view === 'grid' ? 'size-12 sm:size-14' : 'size-10 rounded-xl',
                      )}
                    >
                      <Tags aria-hidden='true' className={view === 'grid' ? 'size-6' : 'size-5'} />
                    </span>
                    <div className='min-w-0 flex-1'>
                      <h2
                        className={cn(
                          'font-semibold wrap-break-word text-surface-foreground',
                          view === 'grid' ? 'text-lg' : 'truncate text-base',
                        )}
                      >
                        {category.name}
                      </h2>
                      <p className='mt-0.5 truncate text-xs text-muted-foreground'>
                        /{category.slug}
                      </p>
                    </div>
                    <Badge
                      variant='secondary'
                      className={cn(
                        'shrink-0 bg-primary/10 text-primary',
                        view === 'grid' ? 'self-end px-2.5 py-1' : 'px-2 py-0.5',
                      )}
                    >
                      {t('categories.wordCount', { count: category.wordCount })}
                    </Badge>
                    {renderCategoryActions(category, index)}
                  </li>
                );
              })}
            </ul>
          )}
        </FetchingContent>
      </div>

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
            .then(() => {
              if (categories.length === 1 && currentPage > 1) {
                setCurrentPage((page) => page - 1);
              }
              setDeleting(null);
            })
            .catch(() => setRequestError(t('categories.manager.requestError')));
        }}
      />
    </section>
  );
}
