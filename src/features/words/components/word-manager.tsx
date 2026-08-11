'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  Eye,
  Globe2,
  Grid2X2,
  ImageIcon,
  List,
  LockKeyhole,
  MoreVertical,
  Pencil,
  Plus,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';

import { AlertDialog } from '@/components/alert-dialog';
import { Dialog } from '@/components/dialog';
import { FilterCombobox } from '@/components/filter-combobox';
import { createFormInputs, Form } from '@/components/form';
import { ImageWithSkeleton } from '@/components/image-with-skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PART_OF_SPEECH_OPTIONS } from '@/constants/part-of-speech';
import { getManageWordRoute, getPublicWordRoute, getWordImageRoute } from '@/constants/routes';
import { getStoredWordImagePath, WORD_IMAGE, WORD_LIMITS } from '@/constants/word';
import type { AdminWord } from '@/features/words/word.api';
import {
  useCreateWord,
  useDeleteWord,
  useUpdateWord,
  useWords,
} from '@/features/words/word.queries';
import { createWordFormSchema, type WordFormValues } from '@/features/words/word.schema';
import { ApiError } from '@/lib/api/errors';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const defaultValues = {
  word: '',
  pronunciationIpa: '',
  pronunciationThai: '',
  partOfSpeech: '',
  meaningsTh: [] as string[],
  exampleSentence: '',
  exampleSentenceMeaningTh: '',
  imageUrl: '',
  isPublic: false,
  categoryIds: [] as number[],
};

const {
  InputCheckbox,
  InputCombobox,
  InputFile,
  InputMultiCombobox,
  InputTags,
  InputText,
  InputTextarea,
} = createFormInputs<WordFormValues>();

const PAGE_SIZE_OPTIONS = [
  { label: '6', value: '6' },
  { label: '12', value: '12' },
  { label: '24', value: '24' },
] as const;

type WordView = 'grid' | 'list';

function getImageExtension(file: File) {
  const extension = file.name.split('.').pop()?.toLocaleLowerCase();

  if (extension?.match(/^[a-z0-9]+$/)) {
    return extension;
  }

  return file.type.split('/')[1] ?? 'jpg';
}

async function removeStoredImage(imageUrl: string) {
  const path = getStoredWordImagePath(imageUrl);

  if (!path) {
    return;
  }

  const { error } = await createSupabaseClient().storage.from(WORD_IMAGE.BUCKET).remove([path]);

  if (error) {
    throw error;
  }
}

async function uploadWordImage(file: File) {
  const path = `words/${crypto.randomUUID()}.${getImageExtension(file)}`;
  const storage = createSupabaseClient().storage.from(WORD_IMAGE.BUCKET);
  const { error } = await storage.upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw error;
  }

  return path;
}

export function WordManager({
  categories,
  initialWords,
}: {
  categories: { id: number; name: string }[];
  initialWords: AdminWord[];
}) {
  const t = useTranslations();
  const schema = useMemo(
    () =>
      createWordFormSchema({
        wordRequired: t('words.manager.validation.wordRequired'),
        meaningsRequired: t('words.manager.validation.meaningsRequired'),
        tooLong: t('words.manager.validation.tooLong'),
        tooManyMeanings: t('words.manager.validation.tooManyMeanings', {
          maxCount: WORD_LIMITS.MEANINGS_MAX_COUNT,
        }),
      }),
    [t],
  );
  const wordsQuery = useWords(initialWords);
  const createWordMutation = useCreateWord();
  const updateWordMutation = useUpdateWord();
  const deleteWordMutation = useDeleteWord();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [partOfSpeechFilter, setPartOfSpeechFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [view, setView] = useState<WordView>('grid');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [wordToDelete, setWordToDelete] = useState<AdminWord | null>(null);
  const form = useForm<WordFormValues, unknown, WordFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const {
    control,
    reset,
    formState: { isDirty, isSubmitting },
  } = form;
  const imageUrl = useWatch({ control, name: 'imageUrl' });
  const words = wordsQuery.data;
  const deletingId = deleteWordMutation.isPending ? deleteWordMutation.variables : null;
  const isSaving = isSubmitting || createWordMutation.isPending || updateWordMutation.isPending;
  const apiRequestError =
    createWordMutation.error ??
    updateWordMutation.error ??
    deleteWordMutation.error ??
    wordsQuery.error;
  const displayedRequestError =
    requestError ??
    (apiRequestError instanceof ApiError && apiRequestError.status === 409
      ? t('words.manager.validation.duplicateWord')
      : apiRequestError
        ? t('words.manager.requestError')
        : null);

  useEffect(
    () => () => {
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    },
    [selectedImagePreview],
  );

  const filteredWords = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();

    return words.filter((word) => {
      const matchesQuery =
        !query ||
        [
          word.word,
          word.partOfSpeech,
          word.pronunciationIpa,
          word.pronunciationThai,
          ...word.meaningsTh,
        ].some((value) => value.toLocaleLowerCase().includes(query));
      const matchesCategory =
        !categoryFilter ||
        word.categories.some((category) => category.id === Number(categoryFilter));
      const matchesPartOfSpeech = !partOfSpeechFilter || word.partOfSpeech === partOfSpeechFilter;

      return matchesQuery && matchesCategory && matchesPartOfSpeech;
    });
  }, [categoryFilter, partOfSpeechFilter, searchQuery, words]);
  const categoryFilterOptions = useMemo(
    () => [
      { label: t('words.manager.allCategories'), value: '' },
      ...categories.map((category) => ({ label: category.name, value: String(category.id) })),
    ],
    [categories, t],
  );
  const partOfSpeechFilterOptions = useMemo(
    () => [{ label: t('words.manager.allPartsOfSpeech'), value: '' }, ...PART_OF_SPEECH_OPTIONS],
    [t],
  );
  const totalPages = Math.max(1, Math.ceil(filteredWords.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedWords = filteredWords.slice((activePage - 1) * pageSize, activePage * pageSize);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (page) => page === 1 || page === totalPages || Math.abs(page - activePage) <= 1,
  );
  const activeFilterCount = Number(Boolean(categoryFilter)) + Number(Boolean(partOfSpeechFilter));

  function resetForm() {
    setEditingId(null);
    setSelectedImage(null);
    setSelectedImagePreview(null);
    reset(defaultValues);
  }

  function clearRequestErrors() {
    setRequestError(null);
    createWordMutation.reset();
    updateWordMutation.reset();
    deleteWordMutation.reset();
  }

  function openDialog() {
    setIsDialogOpen(true);
  }

  function openCreateDialog() {
    clearRequestErrors();
    resetForm();
    openDialog();
  }

  function closeDialog() {
    setIsDiscardDialogOpen(false);
    setIsDialogOpen(false);
    resetForm();
  }

  function requestCloseDialog() {
    if (isSaving) {
      return;
    }

    if (isDirty || selectedImage !== null) {
      setIsDiscardDialogOpen(true);
      return;
    }

    closeDialog();
  }

  function requestDeleteWord(word: AdminWord) {
    clearRequestErrors();
    setWordToDelete(word);
  }

  function closeDeleteDialog() {
    setWordToDelete(null);
  }

  function selectImage(file: File | null) {
    clearRequestErrors();

    if (!file) {
      setSelectedImage(null);
      setSelectedImagePreview(null);
      return;
    }

    if (!WORD_IMAGE.ACCEPTED_TYPES.some((type) => type === file.type)) {
      setSelectedImage(null);
      setSelectedImagePreview(null);
      setRequestError(t('words.manager.validation.invalidImageType'));
      return;
    }

    if (file.size > WORD_IMAGE.MAX_SIZE_BYTES) {
      setSelectedImage(null);
      setSelectedImagePreview(null);
      setRequestError(t('words.manager.validation.imageTooLarge'));
      return;
    }

    setSelectedImage(file);
    setSelectedImagePreview(URL.createObjectURL(file));
  }

  async function saveWord(values: WordFormValues) {
    clearRequestErrors();
    let uploadedImagePath: string | null = null;

    try {
      let nextValues = values;

      if (selectedImage) {
        uploadedImagePath = await uploadWordImage(selectedImage);
        nextValues = { ...values, imageUrl: uploadedImagePath };
      }

      if (editingId !== null) {
        await updateWordMutation.mutateAsync({
          id: editingId,
          values: nextValues,
        });
        closeDialog();
        return;
      }

      await createWordMutation.mutateAsync(nextValues);
      closeDialog();
    } catch (error) {
      if (uploadedImagePath) {
        try {
          await removeStoredImage(uploadedImagePath);
        } catch (error) {
          console.error('Unable to remove an unused word image', error);
        }
      }

      if (!(error instanceof ApiError)) {
        setRequestError(t('words.manager.requestError'));
      }
    }
  }

  function editWord(word: AdminWord) {
    clearRequestErrors();
    setEditingId(word.id);
    reset({
      word: word.word,
      pronunciationIpa: word.pronunciationIpa,
      pronunciationThai: word.pronunciationThai,
      partOfSpeech: word.partOfSpeech,
      meaningsTh: word.meaningsTh,
      exampleSentence: word.exampleSentence,
      exampleSentenceMeaningTh: word.exampleSentenceMeaningTh,
      imageUrl: word.imageUrl,
      isPublic: word.isPublic,
      categoryIds: word.categories.map((category) => category.id),
    });
    openDialog();
  }

  async function deleteWord(id: number) {
    clearRequestErrors();

    try {
      await deleteWordMutation.mutateAsync(id);

      if (editingId === id) {
        resetForm();
      }

      setWordToDelete(null);
    } catch {
      // The mutation exposes a normalized error for the existing alert UI.
    }
  }

  function renderWordThumbnail(word: AdminWord, className: string) {
    return (
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-2xl border border-border bg-secondary-hover',
          className,
        )}
      >
        {word.imageUrl ? (
          <ImageWithSkeleton
            src={getWordImageRoute(word.id)}
            alt={t('words.flashcard.imageAlt', { word: word.word })}
            className='object-cover'
          />
        ) : (
          <span className='grid size-full place-items-center text-muted-foreground'>
            <ImageIcon aria-hidden='true' className='size-7' />
          </span>
        )}
      </div>
    );
  }

  function renderWordActions(word: AdminWord) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='cursor-pointer rounded-xl text-muted-foreground hover:bg-secondary-hover hover:text-surface-foreground'
            aria-label={`${t('words.manager.actions')}: ${word.word}`}
          >
            <MoreVertical aria-hidden='true' className='size-5' />
          </Button>
        </PopoverTrigger>
        <PopoverContent align='end' sideOffset={6} className='w-56 p-2'>
          <Link
            href={getManageWordRoute(word.id)}
            className='flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-surface-foreground transition-colors hover:bg-secondary-hover'
          >
            <Eye aria-hidden='true' className='size-4 text-muted-foreground' />
            {t('words.manager.openDetails')}
          </Link>
          {word.isPublic && (
            <Link
              href={getPublicWordRoute(word.word)}
              className='flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-surface-foreground transition-colors hover:bg-secondary-hover'
            >
              <Globe2 aria-hidden='true' className='size-4 text-muted-foreground' />
              {t('words.manager.openPublicPage')}
            </Link>
          )}
          {word.imageUrl && (
            <a
              href={getWordImageRoute(word.id)}
              target='_blank'
              rel='noreferrer'
              className='flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-surface-foreground transition-colors hover:bg-secondary-hover'
            >
              <ImageIcon aria-hidden='true' className='size-4 text-muted-foreground' />
              {t('words.manager.openImage')}
              <ExternalLink aria-hidden='true' className='ml-auto size-3.5 text-muted-foreground' />
            </a>
          )}
          <Button
            type='button'
            variant='ghost'
            className='h-10 w-full cursor-pointer justify-start rounded-lg px-3 text-surface-foreground hover:bg-secondary-hover'
            onClick={() => editWord(word)}
          >
            <Pencil aria-hidden='true' className='size-4 text-muted-foreground' />
            {t('words.manager.edit')}
          </Button>
          <div className='my-1 h-px bg-border' />
          <Button
            type='button'
            variant='ghost'
            className='h-10 w-full cursor-pointer justify-start rounded-lg px-3 text-danger hover:bg-danger/10 hover:text-danger'
            disabled={deletingId === word.id}
            onClick={() => requestDeleteWord(word)}
          >
            <Trash2 aria-hidden='true' className='size-4' />
            {t('words.manager.delete')}
          </Button>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className='space-y-6'>
      {displayedRequestError && (
        <Alert
          variant='destructive'
          className='rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger'
        >
          <AlertDescription className='text-danger'>{displayedRequestError}</AlertDescription>
        </Alert>
      )}

      <AlertDialog
        open={Boolean(wordToDelete)}
        onOpenChange={(open) => {
          if (!open && deletingId === null) {
            closeDeleteDialog();
          }
        }}
        icon={<Trash2 aria-hidden='true' className='size-5' />}
        title={t('words.manager.deleteDialogTitle')}
        description={t('words.manager.deleteDialogDescription', {
          word: wordToDelete?.word ?? '',
        })}
        cancelLabel={t('words.manager.cancel')}
        actionLabel={t('words.manager.confirmDelete')}
        actionIcon={<Trash2 aria-hidden='true' className='size-4' />}
        actionVariant='destructive'
        actionDisabled={!wordToDelete}
        pending={deletingId !== null}
        closeOnAction={false}
        tone='danger'
        onAction={() => {
          if (wordToDelete) {
            void deleteWord(wordToDelete.id);
          }
        }}
      >
        {displayedRequestError && (
          <Alert
            variant='destructive'
            className='rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger'
          >
            <AlertDescription className='text-danger'>{displayedRequestError}</AlertDescription>
          </Alert>
        )}
      </AlertDialog>

      <AlertDialog
        open={isDiscardDialogOpen}
        onOpenChange={setIsDiscardDialogOpen}
        icon={<TriangleAlert aria-hidden='true' className='size-5' />}
        title={t('words.manager.discardDialogTitle')}
        description={t('words.manager.discardDialogDescription')}
        cancelLabel={t('words.manager.keepEditing')}
        actionLabel={t('words.manager.discardChanges')}
        actionVariant='destructive'
        tone='warning'
        onAction={closeDialog}
      />

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            requestCloseDialog();
          }
        }}
        title={
          <span className='flex items-center gap-3'>
            <span className='inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary'>
              <BookOpenText aria-hidden='true' className='size-4.5' />
            </span>
            {editingId === null
              ? t('words.manager.createDialogTitle')
              : t('words.manager.editDialogTitle')}
          </span>
        }
        closeLabel={t('words.manager.closeDialog')}
        closeDisabled={isSaving}
        initialFocusId='word'
        size='xl'
        className='h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)]'
      >
        <Form
          className='flex min-h-0 flex-1 flex-col overflow-hidden'
          form={form}
          onSubmit={saveWord}
        >
          <div className='min-h-0 flex-1 scrollbar-gutter-stable overflow-y-auto p-5 sm:p-6'>
            <div className='space-y-6'>
              {displayedRequestError && (
                <Alert
                  variant='destructive'
                  className='rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger'
                >
                  <AlertDescription className='text-danger'>
                    {displayedRequestError}
                  </AlertDescription>
                </Alert>
              )}

              <div className='grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.85fr)] lg:gap-7'>
                <div className='grid content-start gap-5'>
                  <InputText
                    field='word'
                    label={t('words.manager.wordLabel')}
                    placeholder={t('words.manager.wordPlaceholder')}
                    maxLength={WORD_LIMITS.WORD_MAX_LENGTH}
                    required
                  />

                  <InputMultiCombobox
                    field='categoryIds'
                    label={t('words.manager.categoriesLabel')}
                    hint={t('words.manager.categoriesHint')}
                    placeholder={t('words.manager.categoriesPlaceholder')}
                    searchPlaceholder={t('words.manager.categoriesSearchPlaceholder')}
                    noResultsLabel={t('words.manager.categoriesNoResults')}
                    removeLabel={(name) => t('words.manager.removeCategory', { name })}
                    options={categories.map((category) => ({
                      label: category.name,
                      value: category.id,
                    }))}
                  />

                  <InputTags
                    field='meaningsTh'
                    id='meaning-th'
                    label={t('words.manager.meaningsThLabel')}
                    hint={t('words.manager.meaningsThHint')}
                    addLabel={t('words.manager.addMeaning')}
                    removeLabel={(meaning) =>
                      t('words.manager.removeMeaning', {
                        meaning,
                      })
                    }
                    placeholder={t('words.manager.meaningsThPlaceholder')}
                    maxLength={WORD_LIMITS.MEANING_MAX_LENGTH}
                    maxItems={WORD_LIMITS.MEANINGS_MAX_COUNT}
                    required
                  />
                </div>

                <div className='grid content-start gap-5 lg:border-l lg:border-border lg:pl-7'>
                  <InputCombobox
                    field='partOfSpeech'
                    id='part-of-speech'
                    label={t('words.manager.partOfSpeechLabel')}
                    placeholder={t('words.manager.partOfSpeechPlaceholder')}
                    searchPlaceholder={t('words.manager.partOfSpeechSearchPlaceholder')}
                    noResultsLabel={t('words.manager.partOfSpeechNoResults')}
                    clearLabel={t('words.manager.partOfSpeechClear')}
                    options={PART_OF_SPEECH_OPTIONS}
                  />

                  <InputText
                    field='pronunciationIpa'
                    id='pronunciation-ipa'
                    label={t('words.manager.pronunciationIpaLabel')}
                    placeholder={t('words.manager.pronunciationIpaPlaceholder')}
                    maxLength={WORD_LIMITS.PRONUNCIATION_MAX_LENGTH}
                  />

                  <InputText
                    field='pronunciationThai'
                    id='pronunciation-thai'
                    label={t('words.manager.pronunciationThaiLabel')}
                    placeholder={t('words.manager.pronunciationThaiPlaceholder')}
                    maxLength={WORD_LIMITS.PRONUNCIATION_MAX_LENGTH}
                  />
                </div>
              </div>

              <div className='grid gap-5 border-t border-border pt-6 sm:grid-cols-2'>
                <InputTextarea
                  field='exampleSentence'
                  id='example-sentence'
                  label={t('words.manager.exampleSentenceLabel')}
                  placeholder={t('words.manager.exampleSentencePlaceholder')}
                  maxLength={WORD_LIMITS.EXAMPLE_MAX_LENGTH}
                />

                <InputTextarea
                  field='exampleSentenceMeaningTh'
                  id='example-sentence-meaning-th'
                  label={t('words.manager.exampleSentenceMeaningThLabel')}
                  placeholder={t('words.manager.exampleSentenceMeaningThPlaceholder')}
                  maxLength={WORD_LIMITS.EXAMPLE_MAX_LENGTH}
                />
              </div>

              <div className='border-t border-border pt-6'>
                <InputFile
                  field='imageUrl'
                  id='image-file'
                  label={t('words.manager.imageUploadLabel')}
                  hint={t('words.manager.imageUploadHint')}
                  accept={WORD_IMAGE.ACCEPTED_TYPES.join(',')}
                  chooseLabel={t('words.manager.chooseImage')}
                  replaceLabel={t('words.manager.replaceImage')}
                  formatsLabel={t('words.manager.imageFormats')}
                  file={selectedImage}
                  currentFileLabel={t('words.manager.currentImage')}
                  description={
                    selectedImage
                      ? t('words.manager.readyToUpload')
                      : t('words.manager.uploadedImage')
                  }
                  removeLabel={t('words.manager.removeImage')}
                  onFileChange={selectImage}
                  preview={
                    selectedImagePreview || imageUrl ? (
                      <ImageWithSkeleton
                        src={
                          selectedImagePreview ??
                          (editingId === null ? imageUrl : getWordImageRoute(editingId))
                        }
                        alt={t('words.manager.imagePreviewAlt')}
                        className='object-cover'
                      />
                    ) : undefined
                  }
                />
              </div>

              <div className='border-t border-border pt-6'>
                <InputCheckbox
                  field='isPublic'
                  id='is-public'
                  label={t('words.manager.publicLabel')}
                  hint={t('words.manager.publicHint')}
                  icon={<Globe2 className='size-5' />}
                />
              </div>
            </div>
          </div>

          <div className='grid shrink-0 grid-cols-2 gap-3 border-t border-border bg-surface/95 px-5 py-4 backdrop-blur sm:flex sm:justify-end sm:px-6'>
            <Button
              type='button'
              variant='outline'
              className='h-11 w-full cursor-pointer rounded-lg border-border px-4 font-medium text-surface-foreground hover:bg-secondary-hover sm:w-auto'
              disabled={isSaving}
              onClick={requestCloseDialog}
            >
              <X aria-hidden='true' className='size-4' />
              {t('words.manager.cancel')}
            </Button>
            <Button
              type='submit'
              className='h-11 w-full cursor-pointer rounded-lg bg-primary px-4 font-medium text-primary-foreground hover:bg-primary-hover disabled:cursor-wait sm:w-auto'
              disabled={isSaving}
            >
              {editingId === null ? (
                <Plus aria-hidden='true' className='size-4' />
              ) : (
                <Save aria-hidden='true' className='size-4' />
              )}
              {editingId === null ? t('words.manager.create') : t('words.manager.update')}
            </Button>
          </div>
        </Form>
      </Dialog>

      <section className='space-y-4' aria-labelledby='word-list-title'>
        <div className='galexi-toolbar space-y-4 p-4 sm:p-5'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='flex min-w-0 items-center gap-3'>
              <span className='inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                <BookOpenText aria-hidden='true' className='size-5' />
              </span>
              <div className='min-w-0'>
                <h2
                  id='word-list-title'
                  className='truncate text-xl font-semibold text-surface-foreground'
                >
                  {t('words.manager.listTitle')}
                </h2>
                <p className='mt-0.5 text-sm text-muted-foreground'>
                  {t('words.manager.resultCount', { count: filteredWords.length })}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Button
                type='button'
                className='h-11 cursor-pointer rounded-xl bg-primary px-4 text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover'
                onClick={openCreateDialog}
              >
                <Plus aria-hidden='true' className='size-4' />
                {t('words.manager.create')}
              </Button>
            </div>
          </div>

          <form
            className='flex items-center gap-2'
            role='search'
            onSubmit={(event) => {
              event.preventDefault();
              setSearchQuery(searchInput);
              setCurrentPage(1);
            }}
          >
            <label className='relative min-w-0 flex-1'>
              <span className='sr-only'>{t('words.manager.searchLabel')}</span>
              <Search
                aria-hidden='true'
                className='pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground'
              />
              <Input
                type='search'
                className='h-12 w-full rounded-2xl border border-border bg-field pr-4 pl-12 text-sm text-surface-foreground shadow-xs outline-none placeholder:text-muted-foreground focus:border-focus focus:ring-2 focus:ring-focus/20 dark:bg-field'
                value={searchInput}
                placeholder={t('words.manager.searchPlaceholder')}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </label>
            <Button
              type='button'
              variant='outline'
              size='icon-lg'
              className={cn(
                'relative size-12 cursor-pointer rounded-2xl border-border bg-surface text-muted-foreground shadow-xs hover:bg-secondary-hover dark:bg-surface',
                isFilterPanelOpen && 'border-primary text-primary ring-2 ring-primary/15',
              )}
              aria-label={t('words.manager.filters')}
              aria-expanded={isFilterPanelOpen}
              onClick={() => setIsFilterPanelOpen((open) => !open)}
            >
              <SlidersHorizontal aria-hidden='true' className='size-5' />
              {activeFilterCount > 0 && (
                <span className='absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-primary text-[0.65rem] font-semibold text-primary-foreground'>
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <Button
              type='submit'
              size='icon-lg'
              className='size-12 cursor-pointer rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary-hover'
              aria-label={t('words.manager.searchAction')}
            >
              <Search aria-hidden='true' className='size-5' />
            </Button>
          </form>

          {isFilterPanelOpen && (
            <div className='grid animate-in gap-3 border-t border-border pt-4 duration-150 fade-in-0 slide-in-from-top-1 sm:grid-cols-2'>
              <FilterCombobox
                value={categoryFilter}
                ariaLabel={t('words.manager.categoryFilterLabel')}
                options={categoryFilterOptions}
                searchPlaceholder={t('words.manager.categoriesSearchPlaceholder')}
                noResultsLabel={t('words.manager.categoriesNoResults')}
                onValueChange={(value) => {
                  setCategoryFilter(value);
                  setCurrentPage(1);
                }}
              />
              <FilterCombobox
                value={partOfSpeechFilter}
                ariaLabel={t('words.manager.partOfSpeechFilterLabel')}
                options={partOfSpeechFilterOptions}
                searchPlaceholder={t('words.manager.partOfSpeechSearchPlaceholder')}
                noResultsLabel={t('words.manager.partOfSpeechNoResults')}
                onValueChange={(value) => {
                  setPartOfSpeechFilter(value);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </div>

        {filteredWords.length > 0 && (
          <div className='galexi-panel flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4'>
            <nav
              className='order-2 flex items-center justify-center gap-1 sm:order-1 sm:justify-start'
              aria-label={t('words.manager.paginationLabel')}
            >
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='hidden cursor-pointer rounded-xl border-border bg-surface sm:inline-flex dark:bg-surface'
                aria-label={t('words.manager.firstPage')}
                disabled={activePage === 1}
                onClick={() => setCurrentPage(1)}
              >
                <ChevronsLeft aria-hidden='true' className='size-4' />
              </Button>
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='cursor-pointer rounded-xl border-border bg-surface dark:bg-surface'
                aria-label={t('words.manager.previousPage')}
                disabled={activePage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                <ChevronLeft aria-hidden='true' className='size-4' />
              </Button>
              {pageNumbers.map((page) => (
                <Button
                  key={page}
                  type='button'
                  variant={page === activePage ? 'default' : 'ghost'}
                  size='icon'
                  className={cn(
                    'cursor-pointer rounded-xl',
                    page !== activePage && 'hidden sm:inline-flex',
                    page === activePage && 'shadow-md shadow-primary/20',
                  )}
                  aria-label={t('words.manager.goToPage', { page })}
                  aria-current={page === activePage ? 'page' : undefined}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='cursor-pointer rounded-xl border-border bg-surface dark:bg-surface'
                aria-label={t('words.manager.nextPage')}
                disabled={activePage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                <ChevronRight aria-hidden='true' className='size-4' />
              </Button>
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='hidden cursor-pointer rounded-xl border-border bg-surface sm:inline-flex dark:bg-surface'
                aria-label={t('words.manager.lastPage')}
                disabled={activePage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
              >
                <ChevronsRight aria-hidden='true' className='size-4' />
              </Button>
            </nav>

            <div className='order-1 flex items-center justify-between gap-2 border-b border-border pb-3 sm:order-2 sm:justify-end sm:gap-3 sm:border-0 sm:pb-0'>
              <p className='min-w-0 flex-1 truncate text-xs text-muted-foreground sm:flex-none sm:text-sm'>
                {t('words.manager.showingResults', {
                  from: (activePage - 1) * pageSize + 1,
                  to: Math.min(activePage * pageSize, filteredWords.length),
                  total: filteredWords.length,
                })}
              </p>
              <FilterCombobox
                value={String(pageSize)}
                ariaLabel={t('words.manager.pageSizeLabel')}
                className='w-18 shrink-0 sm:w-20'
                options={[...PAGE_SIZE_OPTIONS]}
                searchPlaceholder={t('words.manager.pageSizeLabel')}
                noResultsLabel={t('words.manager.pageSizeLabel')}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              />
              <div className='flex rounded-xl border border-border bg-surface p-1 dark:bg-surface'>
                <Button
                  type='button'
                  variant={view === 'grid' ? 'default' : 'ghost'}
                  size='icon-sm'
                  className='cursor-pointer rounded-lg'
                  aria-label={t('words.manager.gridView')}
                  aria-pressed={view === 'grid'}
                  onClick={() => setView('grid')}
                >
                  <Grid2X2 aria-hidden='true' className='size-4' />
                </Button>
                <Button
                  type='button'
                  variant={view === 'list' ? 'default' : 'ghost'}
                  size='icon-sm'
                  className='cursor-pointer rounded-lg'
                  aria-label={t('words.manager.listView')}
                  aria-pressed={view === 'list'}
                  onClick={() => setView('list')}
                >
                  <List aria-hidden='true' className='size-4' />
                </Button>
              </div>
            </div>
          </div>
        )}

        {words.length === 0 ? (
          <EmptyState>{t('words.manager.empty')}</EmptyState>
        ) : filteredWords.length === 0 ? (
          <EmptyState>{t('words.manager.noSearchResults')}</EmptyState>
        ) : view === 'grid' ? (
          <ul className='grid gap-4 lg:grid-cols-2'>
            {paginatedWords.map((word) => (
              <li
                key={word.id}
                className='group flex min-h-36 gap-3 rounded-3xl border border-border bg-surface p-4 shadow-[0_16px_45px_rgb(34_74_150/7%)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/8'
              >
                {renderWordThumbnail(word, 'size-20 sm:size-24')}
                <div className='flex min-w-0 flex-1 flex-col'>
                  <div className='flex items-start gap-2'>
                    <div className='min-w-0 flex-1'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <h3 className='text-lg font-semibold wrap-break-word text-surface-foreground sm:text-xl'>
                          {word.word}
                        </h3>
                        {word.partOfSpeech && (
                          <Badge variant='secondary' className='bg-secondary-hover text-primary'>
                            {word.partOfSpeech}
                          </Badge>
                        )}
                      </div>
                      {(word.pronunciationIpa || word.pronunciationThai) && (
                        <p className='mt-1 text-sm leading-5 text-muted-foreground'>
                          {[word.pronunciationIpa, word.pronunciationThai]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}
                    </div>
                    {renderWordActions(word)}
                  </div>

                  <div className='mt-2.5 flex flex-wrap gap-1.5'>
                    <Badge
                      variant='secondary'
                      className={cn(
                        'gap-1 px-2.5 py-1',
                        word.isPublic
                          ? 'bg-primary/12 text-primary'
                          : 'bg-secondary-hover text-muted-foreground',
                      )}
                    >
                      {word.isPublic ? (
                        <Globe2 aria-hidden='true' className='size-3' />
                      ) : (
                        <LockKeyhole aria-hidden='true' className='size-3' />
                      )}
                      {word.isPublic
                        ? t('words.manager.publicBadge')
                        : t('words.manager.unpublishedBadge')}
                    </Badge>
                    {word.meaningsTh.slice(0, 2).map((meaning) => (
                      <Badge key={meaning} className='bg-primary/10 text-primary'>
                        {meaning}
                      </Badge>
                    ))}
                  </div>

                  {word.categories.length > 0 && (
                    <p className='mt-auto pt-3 text-xs text-muted-foreground'>
                      {word.categories.map((category) => category.name).join(' · ')}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <ul className='grid gap-3 lg:hidden'>
              {paginatedWords.map((word) => (
                <li
                  key={word.id}
                  className='flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-[0_12px_35px_rgb(34_74_150/6%)]'
                >
                  {renderWordThumbnail(word, 'size-18')}
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <h3 className='truncate font-semibold text-surface-foreground'>
                        {word.word}
                      </h3>
                      {word.partOfSpeech && (
                        <Badge
                          variant='secondary'
                          className='shrink-0 bg-secondary-hover text-primary'
                        >
                          {word.partOfSpeech}
                        </Badge>
                      )}
                    </div>
                    <p className='mt-1 truncate text-sm text-muted-foreground'>
                      {word.meaningsTh.join(' · ')}
                    </p>
                  </div>
                  {renderWordActions(word)}
                </li>
              ))}
            </ul>

            <div className='hidden overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_18px_50px_rgb(34_74_150/7%)] lg:block'>
              <div className='grid grid-cols-[minmax(14rem,2fr)_minmax(8rem,1fr)_minmax(10rem,1.3fr)_8rem_3rem] items-center gap-4 border-b border-border bg-secondary-hover/45 px-5 py-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase'>
                <span>{t('words.manager.wordLabel')}</span>
                <span>{t('words.manager.partOfSpeechLabel')}</span>
                <span>{t('words.manager.categoriesLabel')}</span>
                <span>{t('words.manager.visibility')}</span>
                <span className='sr-only'>{t('words.manager.actions')}</span>
              </div>
              <ul className='divide-y divide-border'>
                {paginatedWords.map((word) => (
                  <li
                    key={word.id}
                    className='grid grid-cols-[minmax(14rem,2fr)_minmax(8rem,1fr)_minmax(10rem,1.3fr)_8rem_3rem] items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary-hover/35'
                  >
                    <div className='flex min-w-0 items-center gap-3'>
                      {renderWordThumbnail(word, 'size-12 rounded-xl')}
                      <div className='min-w-0'>
                        <p className='truncate font-semibold text-surface-foreground'>
                          {word.word}
                        </p>
                        <p className='mt-0.5 truncate text-xs text-muted-foreground'>
                          {word.meaningsTh.join(' · ')}
                        </p>
                      </div>
                    </div>
                    <span className='truncate text-sm text-surface-foreground'>
                      {word.partOfSpeech || '—'}
                    </span>
                    <span className='truncate text-sm text-muted-foreground'>
                      {word.categories.map((category) => category.name).join(', ') || '—'}
                    </span>
                    <Badge
                      variant='secondary'
                      className={cn(
                        'w-fit gap-1 px-2.5 py-1',
                        word.isPublic
                          ? 'bg-primary/12 text-primary'
                          : 'bg-secondary-hover text-muted-foreground',
                      )}
                    >
                      {word.isPublic ? (
                        <Globe2 aria-hidden='true' className='size-3' />
                      ) : (
                        <LockKeyhole aria-hidden='true' className='size-3' />
                      )}
                      {word.isPublic
                        ? t('words.manager.publicBadge')
                        : t('words.manager.unpublishedBadge')}
                    </Badge>
                    {renderWordActions(word)}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className='galexi-empty'>{children}</p>;
}
