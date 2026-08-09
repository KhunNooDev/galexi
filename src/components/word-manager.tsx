'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BookOpenText,
  ExternalLink,
  Eye,
  Globe2,
  ImageIcon,
  LockKeyhole,
  Pencil,
  Plus,
  Save,
  Search,
  Tags,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';

import { AlertDialog } from '@/components/alert-dialog';
import { Dialog } from '@/components/dialog';
import { FilterCombobox } from '@/components/filter-combobox';
import { createFormInputs, Form } from '@/components/form';
import { ImageWithSkeleton } from '@/components/image-with-skeleton';
import { Tooltip } from '@/components/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PART_OF_SPEECH_OPTIONS } from '@/constants/part-of-speech';
import {
  getManageWordRoute,
  getPublicWordRoute,
  getWordImageRoute,
  ROUTES,
} from '@/constants/routes';
import { getStoredWordImagePath, WORD_IMAGE, WORD_LIMITS } from '@/constants/word';
import {
  useCreateWord,
  useDeleteWord,
  useUpdateWord,
  useWords,
} from '@/features/words/word.queries';
import { createWordFormSchema, type WordFormValues } from '@/features/words/word.schema';
import { ApiError } from '@/lib/api/errors';
import type { AdminWord } from '@/lib/api/words';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [partOfSpeechFilter, setPartOfSpeechFilter] = useState('');
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

      <section className='space-y-5' aria-labelledby='word-list-title'>
        <div className='rounded-3xl border border-border bg-surface/80 p-4 shadow-sm backdrop-blur-xl sm:p-5'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <div>
              <div className='flex items-center gap-3'>
                <span className='inline-flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                  <BookOpenText aria-hidden='true' className='size-5' />
                </span>
                <div>
                  <h2
                    id='word-list-title'
                    className='text-xl font-semibold text-surface-foreground'
                  >
                    {t('words.manager.listTitle')}
                  </h2>
                </div>
              </div>
            </div>

            <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
              <label className='relative min-w-0 sm:w-64'>
                <span className='sr-only'>{t('words.manager.searchLabel')}</span>
                <Search
                  aria-hidden='true'
                  className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground'
                />
                <Input
                  type='search'
                  className='h-11 w-full rounded-full border border-border bg-background pr-4 pl-10 text-sm text-surface-foreground outline-none placeholder:text-muted-foreground focus:border-focus focus:ring-2 focus:ring-focus/20'
                  value={searchQuery}
                  placeholder={t('words.manager.searchPlaceholder')}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </label>
              <FilterCombobox
                value={categoryFilter}
                ariaLabel={t('words.manager.categoryFilterLabel')}
                className='sm:w-44'
                options={categoryFilterOptions}
                searchPlaceholder={t('words.manager.categoriesSearchPlaceholder')}
                noResultsLabel={t('words.manager.categoriesNoResults')}
                onValueChange={setCategoryFilter}
              />
              <FilterCombobox
                value={partOfSpeechFilter}
                ariaLabel={t('words.manager.partOfSpeechFilterLabel')}
                className='sm:w-48'
                options={partOfSpeechFilterOptions}
                searchPlaceholder={t('words.manager.partOfSpeechSearchPlaceholder')}
                noResultsLabel={t('words.manager.partOfSpeechNoResults')}
                onValueChange={setPartOfSpeechFilter}
              />
              <div className='flex items-center justify-between gap-3 sm:justify-start'>
                <Badge
                  variant='secondary'
                  className='h-10 min-w-10 rounded-full bg-secondary-hover px-3 text-sm text-muted-foreground'
                >
                  {filteredWords.length}
                </Badge>
                <Button asChild type='button' variant='outline' className='h-11 rounded-full'>
                  <Link href={ROUTES.MANAGE_CATEGORIES}>
                    <Tags aria-hidden='true' className='size-4' />
                    {t('words.manager.manageCategories')}
                  </Link>
                </Button>
                <Button
                  type='button'
                  className='h-11 flex-1 cursor-pointer rounded-full bg-primary px-5 text-sm text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-hover sm:flex-none'
                  onClick={openCreateDialog}
                >
                  <Plus aria-hidden='true' className='size-4' />
                  {t('words.manager.create')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {words.length === 0 ? (
          <EmptyState>{t('words.manager.empty')}</EmptyState>
        ) : filteredWords.length === 0 ? (
          <EmptyState>{t('words.manager.noSearchResults')}</EmptyState>
        ) : (
          <ul className='grid gap-4 md:grid-cols-2'>
            {filteredWords.map((word) => (
              <li
                key={word.id}
                className='group relative flex min-h-64 flex-col overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/8 sm:p-6'
              >
                <div className='pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100' />

                <div className='flex items-start gap-3'>
                  <span className='inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                    <BookOpenText aria-hidden='true' className='size-5' />
                  </span>
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <h3 className='text-xl font-semibold wrap-break-word text-surface-foreground'>
                        {word.word}
                      </h3>
                      {word.partOfSpeech && (
                        <Badge
                          variant='secondary'
                          className='bg-secondary-hover text-muted-foreground'
                        >
                          {word.partOfSpeech}
                        </Badge>
                      )}
                    </div>
                    {(word.pronunciationIpa || word.pronunciationThai) && (
                      <p className='mt-1.5 text-sm leading-5 text-muted-foreground'>
                        {[word.pronunciationIpa, word.pronunciationThai]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant='secondary'
                    className={cn(
                      'shrink-0 gap-1 px-2.5 py-1',
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
                </div>

                <div className='mt-5 flex flex-wrap gap-2'>
                  {word.meaningsTh.map((meaning) => (
                    <Badge
                      key={meaning}
                      className='border-primary/10 bg-primary/10 px-3 py-1 text-sm text-primary'
                    >
                      {meaning}
                    </Badge>
                  ))}
                </div>

                {word.categories.length > 0 && (
                  <div className='mt-3 flex flex-wrap gap-2'>
                    {word.categories.slice(0, 2).map((category) => (
                      <Badge key={category.id} variant='outline' className='text-primary'>
                        {category.name}
                      </Badge>
                    ))}
                    {word.categories.length > 2 && (
                      <Badge variant='outline'>+{word.categories.length - 2}</Badge>
                    )}
                  </div>
                )}

                {word.exampleSentence && (
                  <blockquote className='mt-5 rounded-2xl border-l-2 border-primary/50 bg-background/60 px-4 py-3 text-sm leading-6 text-surface-foreground'>
                    {word.exampleSentence}
                    {word.exampleSentenceMeaningTh && (
                      <span className='mt-1 block text-muted-foreground'>
                        {word.exampleSentenceMeaningTh}
                      </span>
                    )}
                  </blockquote>
                )}

                {word.imageUrl && (
                  <a
                    href={getWordImageRoute(word.id)}
                    target='_blank'
                    rel='noreferrer'
                    className='mt-4 inline-flex w-fit items-center gap-2 text-sm font-medium text-primary hover:underline'
                  >
                    <ImageIcon aria-hidden='true' className='size-4' />
                    {t('words.manager.openImage')}
                    <ExternalLink aria-hidden='true' className='size-3.5' />
                  </a>
                )}

                <div className='mt-auto flex items-center justify-end gap-1 border-t border-border pt-4'>
                  {word.isPublic && (
                    <Tooltip label={t('words.manager.openPublicPage')}>
                      <Link
                        href={getPublicWordRoute(word.word)}
                        className='inline-flex size-9 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/12'
                        aria-label={`${t('words.manager.openPublicPage')}: ${word.word}`}
                      >
                        <Globe2 aria-hidden='true' className='size-4' />
                      </Link>
                    </Tooltip>
                  )}
                  <Tooltip label={t('words.manager.openDetails')}>
                    <Link
                      href={getManageWordRoute(word.id)}
                      className='inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary-hover hover:text-surface-foreground'
                      aria-label={`${t('words.manager.openDetails')}: ${word.word}`}
                    >
                      <Eye aria-hidden='true' className='size-4' />
                    </Link>
                  </Tooltip>
                  <IconButton
                    label={`${t('words.manager.edit')}: ${word.word}`}
                    onClick={() => editWord(word)}
                  >
                    <Pencil aria-hidden='true' className='size-4' />
                  </IconButton>
                  <IconButton
                    label={`${t('words.manager.delete')}: ${word.word}`}
                    danger
                    disabled={deletingId === word.id}
                    onClick={() => requestDeleteWord(word)}
                  >
                    <Trash2 aria-hidden='true' className='size-4' />
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className='rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground'>
      {children}
    </p>
  );
}

function IconButton({
  children,
  danger = false,
  disabled = false,
  label,
  onClick,
}: {
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip label={label}>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className={cn(
          'cursor-pointer rounded-lg disabled:cursor-wait disabled:opacity-60',
          danger
            ? 'text-danger hover:bg-danger hover:text-danger-foreground'
            : 'text-muted-foreground hover:bg-secondary-hover hover:text-surface-foreground',
        )}
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </Button>
    </Tooltip>
  );
}
