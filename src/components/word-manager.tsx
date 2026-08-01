'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { hc } from 'hono/client';
import {
  BookOpenText,
  ExternalLink,
  Eye,
  Globe2,
  ImageIcon,
  ImagePlus,
  LockKeyhole,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getSearchWordRoute, getWordImageRoute, getWordRoute } from '@/constants/routes';
import { getStoredWordImagePath, WORD_IMAGE, WORD_LIMITS } from '@/constants/word';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { ApiType } from '@/server/api';

import { Tooltip } from './tooltip';

const client = hc<ApiType>('/');

type WordLabels = {
  wordRequired: string;
  meaningsRequired: string;
  tooLong: string;
  tooManyMeanings: string;
};

type WordEntry = {
  id: number;
  word: string;
  pronunciationIpa: string;
  pronunciationThai: string;
  partOfSpeech: string;
  meaningsTh: string[];
  exampleSentence: string;
  exampleSentenceMeaningTh: string;
  imageUrl: string;
  isPublic: boolean;
};

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
};

function optionalText(maxLength: number, message: string) {
  return z.string().trim().max(maxLength, message);
}

function createWordSchema(labels: WordLabels) {
  return z.object({
    word: z
      .string()
      .trim()
      .min(1, labels.wordRequired)
      .max(WORD_LIMITS.WORD_MAX_LENGTH, labels.tooLong),
    pronunciationIpa: optionalText(WORD_LIMITS.PRONUNCIATION_MAX_LENGTH, labels.tooLong),
    pronunciationThai: optionalText(WORD_LIMITS.PRONUNCIATION_MAX_LENGTH, labels.tooLong),
    partOfSpeech: optionalText(WORD_LIMITS.PART_OF_SPEECH_MAX_LENGTH, labels.tooLong),
    meaningsTh: z
      .array(z.string().trim().min(1).max(WORD_LIMITS.MEANING_MAX_LENGTH))
      .min(1, labels.meaningsRequired)
      .max(WORD_LIMITS.MEANINGS_MAX_COUNT, labels.tooManyMeanings),
    exampleSentence: optionalText(WORD_LIMITS.EXAMPLE_MAX_LENGTH, labels.tooLong),
    exampleSentenceMeaningTh: optionalText(WORD_LIMITS.EXAMPLE_MAX_LENGTH, labels.tooLong),
    imageUrl: optionalText(WORD_LIMITS.IMAGE_URL_MAX_LENGTH, labels.tooLong),
    isPublic: z.boolean(),
  });
}

type WordFormValues = z.infer<ReturnType<typeof createWordSchema>>;

const inputClassName =
  'h-11 w-full rounded-lg border border-border bg-background px-3 text-surface-foreground outline-none placeholder:text-muted-foreground focus:border-focus focus:ring-2 focus:ring-focus/20';
const textareaClassName =
  'min-h-24 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-surface-foreground outline-none placeholder:text-muted-foreground focus:border-focus focus:ring-2 focus:ring-focus/20';

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

export function WordManager() {
  const t = useTranslations();
  const labels = useMemo<WordLabels>(
    () => ({
      wordRequired: t('words.manager.validation.wordRequired'),
      meaningsRequired: t('words.manager.validation.meaningsRequired'),
      tooLong: t('words.manager.validation.tooLong'),
      tooManyMeanings: t('words.manager.validation.tooManyMeanings', {
        maxCount: WORD_LIMITS.MEANINGS_MAX_COUNT,
      }),
    }),
    [t],
  );
  const schema = useMemo(() => createWordSchema(labels), [labels]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [words, setWords] = useState<WordEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [meaningDraft, setMeaningDraft] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [wordToDelete, setWordToDelete] = useState<WordEntry | null>(null);
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<WordFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const meaningsTh = useWatch({ control, name: 'meaningsTh' });
  const imageUrl = useWatch({ control, name: 'imageUrl' });

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

    if (!query) {
      return words;
    }

    return words.filter((word) =>
      [
        word.word,
        word.partOfSpeech,
        word.pronunciationIpa,
        word.pronunciationThai,
        ...word.meaningsTh,
      ].some((value) => value.toLocaleLowerCase().includes(query)),
    );
  }, [searchQuery, words]);

  useEffect(() => {
    let ignore = false;

    async function loadWords() {
      try {
        const response = await client.api.words.$get();

        if (response.status !== 200) {
          throw new Error('Unable to load words');
        }

        const data = await response.json();

        if (!ignore) {
          setWords(data.words);
        }
      } catch {
        if (!ignore) {
          setRequestError(t('words.manager.loadError'));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadWords();

    return () => {
      ignore = true;
    };
  }, [t]);

  function resetForm() {
    setEditingId(null);
    setMeaningDraft('');
    setSelectedImage(null);
    setSelectedImagePreview(null);
    setImageInputKey((current) => current + 1);
    reset(defaultValues);
  }

  function openDialog() {
    setIsDialogOpen(true);
  }

  function openCreateDialog() {
    setRequestError(null);
    resetForm();
    openDialog();
  }

  function closeDialog() {
    setIsDialogOpen(false);
    resetForm();
  }

  function requestDeleteWord(word: WordEntry) {
    setRequestError(null);
    setWordToDelete(word);
  }

  function closeDeleteDialog() {
    setWordToDelete(null);
  }

  function addMeaning() {
    const meaning = meaningDraft.trim();

    if (
      !meaning ||
      meaningsTh.length >= WORD_LIMITS.MEANINGS_MAX_COUNT ||
      meaningsTh.includes(meaning)
    ) {
      return;
    }

    setValue('meaningsTh', [...meaningsTh, meaning], {
      shouldDirty: true,
      shouldValidate: true,
    });
    clearErrors('meaningsTh');
    setMeaningDraft('');
  }

  function removeMeaning(meaning: string) {
    setValue(
      'meaningsTh',
      meaningsTh.filter((item) => item !== meaning),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  function selectImage(file: File | null) {
    setRequestError(null);

    if (!file) {
      setSelectedImage(null);
      setSelectedImagePreview(null);
      return;
    }

    if (!WORD_IMAGE.ACCEPTED_TYPES.some((type) => type === file.type)) {
      setSelectedImage(null);
      setSelectedImagePreview(null);
      setRequestError(t('words.manager.validation.invalidImageType'));
      setImageInputKey((current) => current + 1);
      return;
    }

    if (file.size > WORD_IMAGE.MAX_SIZE_BYTES) {
      setSelectedImage(null);
      setSelectedImagePreview(null);
      setRequestError(t('words.manager.validation.imageTooLarge'));
      setImageInputKey((current) => current + 1);
      return;
    }

    setSelectedImage(file);
    setSelectedImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setSelectedImage(null);
    setSelectedImagePreview(null);
    setImageInputKey((current) => current + 1);
    setValue('imageUrl', '', { shouldDirty: true });
  }

  async function saveWord(values: WordFormValues) {
    setRequestError(null);
    let uploadedImagePath: string | null = null;
    let wordWasSaved = false;

    try {
      let nextValues = values;

      if (selectedImage) {
        uploadedImagePath = await uploadWordImage(selectedImage);
        nextValues = { ...values, imageUrl: uploadedImagePath };
      }

      if (editingId !== null) {
        const response = await client.api.words[':id'].$patch({
          param: { id: String(editingId) },
          json: nextValues,
        });

        if (response.status !== 200) {
          if ((response.status as number) === 409) {
            if (uploadedImagePath) {
              await removeStoredImage(uploadedImagePath);
            }
            setRequestError(t('words.manager.validation.duplicateWord'));
            return;
          }

          throw new Error('Unable to update word');
        }

        const data = await response.json();
        wordWasSaved = true;
        setWords((current) => current.map((word) => (word.id === editingId ? data.word : word)));

        closeDialog();
        return;
      }

      const response = await client.api.words.$post({ json: nextValues });

      if (response.status !== 201) {
        if ((response.status as number) === 409) {
          if (uploadedImagePath) {
            await removeStoredImage(uploadedImagePath);
          }
          setRequestError(t('words.manager.validation.duplicateWord'));
          return;
        }

        throw new Error('Unable to create word');
      }

      const data = await response.json();
      wordWasSaved = true;
      setWords((current) => [data.word, ...current]);
      closeDialog();
    } catch {
      if (uploadedImagePath && !wordWasSaved) {
        try {
          await removeStoredImage(uploadedImagePath);
        } catch (error) {
          console.error('Unable to remove an unused word image', error);
        }
      }
      setRequestError(t('words.manager.requestError'));
    }
  }

  function editWord(word: WordEntry) {
    setRequestError(null);
    setEditingId(word.id);
    setMeaningDraft('');
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
    });
    openDialog();
  }

  async function deleteWord(id: number) {
    setDeletingId(id);
    setRequestError(null);

    try {
      const response = await client.api.words[':id'].$delete({
        param: { id: String(id) },
      });

      if (response.status !== 200) {
        throw new Error('Unable to delete word');
      }

      setWords((current) => current.filter((word) => word.id !== id));

      if (editingId === id) {
        resetForm();
      }

      setWordToDelete(null);
    } catch {
      setRequestError(t('words.manager.requestError'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className='space-y-6'>
      {requestError && (
        <Alert
          variant='destructive'
          className='rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger'
        >
          <AlertDescription className='text-danger'>{requestError}</AlertDescription>
        </Alert>
      )}

      <AlertDialog
        open={Boolean(wordToDelete)}
        onOpenChange={(open) => {
          if (!open && deletingId === null) {
            closeDeleteDialog();
          }
        }}
      >
        <AlertDialogContent className='max-w-md gap-0 rounded-3xl border-border bg-surface p-6 text-surface-foreground shadow-2xl sm:max-w-md sm:p-7'>
          <AlertDialogHeader className='block text-left'>
            <span className='mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-danger/10 text-danger'>
              <Trash2 aria-hidden='true' className='size-5' />
            </span>
            <AlertDialogTitle className='text-xl text-surface-foreground'>
              {t('words.manager.deleteDialogTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className='mt-2 leading-6'>
              {t('words.manager.deleteDialogDescription', {
                word: wordToDelete?.word ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {requestError && (
            <Alert
              variant='destructive'
              className='mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger'
            >
              <AlertDescription className='text-danger'>{requestError}</AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter className='mt-6 gap-3'>
            <AlertDialogCancel
              className='h-11 cursor-pointer rounded-full border-border px-5 hover:bg-secondary-hover'
              disabled={deletingId !== null}
            >
              {t('words.manager.cancel')}
            </AlertDialogCancel>
            <Button
              type='button'
              variant='destructive'
              className='h-11 cursor-pointer rounded-full bg-danger px-5 text-danger-foreground hover:bg-danger-hover disabled:cursor-wait'
              disabled={!wordToDelete || deletingId !== null}
              onClick={() => {
                if (wordToDelete) {
                  void deleteWord(wordToDelete.id);
                }
              }}
            >
              <Trash2 aria-hidden='true' className='size-4' />
              {t('words.manager.confirmDelete')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className='max-h-[calc(100svh-2rem)] max-w-4xl gap-0 overflow-hidden rounded-3xl border-border bg-surface p-0 text-surface-foreground shadow-2xl sm:max-w-4xl'
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            document.getElementById('word')?.focus();
          }}
        >
          <DialogHeader className='flex-row items-center justify-between gap-4 border-b border-border px-5 py-4 text-left sm:px-6'>
            <div>
              <DialogTitle className='text-xl text-surface-foreground'>
                {editingId === null
                  ? t('words.manager.createDialogTitle')
                  : t('words.manager.editDialogTitle')}
              </DialogTitle>
              <DialogDescription className='mt-1'>
                {t('words.manager.dialogDescription')}
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button
                type='button'
                variant='ghost'
                size='icon-lg'
                className='shrink-0 cursor-pointer rounded-full text-muted-foreground hover:bg-secondary-hover hover:text-foreground'
                aria-label={t('words.manager.closeDialog')}
              >
                <X aria-hidden='true' className='size-5' />
              </Button>
            </DialogClose>
          </DialogHeader>

          <form
            className='grid max-h-[calc(100svh-8rem)] gap-5 overflow-y-auto p-5 sm:grid-cols-2 sm:p-6'
            noValidate
            onSubmit={handleSubmit(saveWord)}
          >
            {requestError && (
              <Alert
                variant='destructive'
                className='rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger sm:col-span-2'
              >
                <AlertDescription className='text-danger'>{requestError}</AlertDescription>
              </Alert>
            )}
            <FormField id='word' label={t('words.manager.wordLabel')} error={errors.word?.message}>
              <Input
                id='word'
                className={inputClassName}
                placeholder={t('words.manager.wordPlaceholder')}
                maxLength={WORD_LIMITS.WORD_MAX_LENGTH}
                aria-invalid={Boolean(errors.word)}
                {...register('word')}
              />
            </FormField>

            <FormField
              id='part-of-speech'
              label={t('words.manager.partOfSpeechLabel')}
              error={errors.partOfSpeech?.message}
            >
              <Input
                id='part-of-speech'
                className={inputClassName}
                placeholder={t('words.manager.partOfSpeechPlaceholder')}
                maxLength={WORD_LIMITS.PART_OF_SPEECH_MAX_LENGTH}
                aria-invalid={Boolean(errors.partOfSpeech)}
                {...register('partOfSpeech')}
              />
            </FormField>

            <FormField
              id='pronunciation-ipa'
              label={t('words.manager.pronunciationIpaLabel')}
              error={errors.pronunciationIpa?.message}
            >
              <Input
                id='pronunciation-ipa'
                className={inputClassName}
                placeholder={t('words.manager.pronunciationIpaPlaceholder')}
                maxLength={WORD_LIMITS.PRONUNCIATION_MAX_LENGTH}
                aria-invalid={Boolean(errors.pronunciationIpa)}
                {...register('pronunciationIpa')}
              />
            </FormField>

            <FormField
              id='pronunciation-thai'
              label={t('words.manager.pronunciationThaiLabel')}
              error={errors.pronunciationThai?.message}
            >
              <Input
                id='pronunciation-thai'
                className={inputClassName}
                placeholder={t('words.manager.pronunciationThaiPlaceholder')}
                maxLength={WORD_LIMITS.PRONUNCIATION_MAX_LENGTH}
                aria-invalid={Boolean(errors.pronunciationThai)}
                {...register('pronunciationThai')}
              />
            </FormField>

            <FormField
              id='meaning-th'
              label={t('words.manager.meaningsThLabel')}
              hint={t('words.manager.meaningsThHint')}
              error={errors.meaningsTh?.message}
              className='sm:col-span-2'
            >
              <Controller
                control={control}
                name='meaningsTh'
                render={() => (
                  <div
                    className='flex min-h-11 flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-2 focus-within:border-focus focus-within:ring-2 focus-within:ring-focus/20'
                    aria-invalid={Boolean(errors.meaningsTh)}
                  >
                    {meaningsTh.map((meaning) => (
                      <Badge
                        key={meaning}
                        className='gap-1 bg-primary/12 px-3 py-1 text-sm text-primary'
                      >
                        {meaning}
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon-xs'
                          className='size-5 cursor-pointer rounded-full p-0.5 text-primary hover:bg-primary/15 hover:text-primary'
                          aria-label={t('words.manager.removeMeaning', {
                            meaning,
                          })}
                          onClick={() => removeMeaning(meaning)}
                        >
                          <X aria-hidden='true' className='size-3.5' />
                        </Button>
                      </Badge>
                    ))}
                    <Input
                      id='meaning-th'
                      className='h-7 min-w-40 flex-1 border-0 bg-transparent px-1 text-sm text-surface-foreground shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0 dark:bg-transparent'
                      value={meaningDraft}
                      placeholder={t('words.manager.meaningsThPlaceholder')}
                      maxLength={WORD_LIMITS.MEANING_MAX_LENGTH}
                      onChange={(event) => setMeaningDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addMeaning();
                        }
                      }}
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon-xs'
                      className='size-7 cursor-pointer rounded-full text-muted-foreground hover:bg-secondary-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40'
                      aria-label={t('words.manager.addMeaning')}
                      disabled={!meaningDraft.trim()}
                      onClick={addMeaning}
                    >
                      <Plus aria-hidden='true' className='size-4' />
                    </Button>
                  </div>
                )}
              />
            </FormField>

            <FormField
              id='example-sentence'
              label={t('words.manager.exampleSentenceLabel')}
              error={errors.exampleSentence?.message}
            >
              <Textarea
                id='example-sentence'
                className={textareaClassName}
                placeholder={t('words.manager.exampleSentencePlaceholder')}
                maxLength={WORD_LIMITS.EXAMPLE_MAX_LENGTH}
                aria-invalid={Boolean(errors.exampleSentence)}
                {...register('exampleSentence')}
              />
            </FormField>

            <FormField
              id='example-sentence-meaning-th'
              label={t('words.manager.exampleSentenceMeaningThLabel')}
              error={errors.exampleSentenceMeaningTh?.message}
            >
              <Textarea
                id='example-sentence-meaning-th'
                className={textareaClassName}
                placeholder={t('words.manager.exampleSentenceMeaningThPlaceholder')}
                maxLength={WORD_LIMITS.EXAMPLE_MAX_LENGTH}
                aria-invalid={Boolean(errors.exampleSentenceMeaningTh)}
                {...register('exampleSentenceMeaningTh')}
              />
            </FormField>

            <FormField
              id='image-file'
              label={t('words.manager.imageUploadLabel')}
              hint={t('words.manager.imageUploadHint')}
              error={errors.imageUrl?.message}
              className='sm:col-span-2'
            >
              <input type='hidden' {...register('imageUrl')} />
              <label
                htmlFor='image-file'
                className='flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/60 px-4 py-5 text-center transition-colors hover:border-primary/40 hover:bg-primary/5'
              >
                <span className='inline-flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                  <ImagePlus aria-hidden='true' className='size-5' />
                </span>
                <span className='mt-2 text-sm font-medium text-surface-foreground'>
                  {selectedImage ? selectedImage.name : t('words.manager.chooseImage')}
                </span>
                <span className='mt-1 text-xs text-muted-foreground'>
                  {t('words.manager.imageFormats')}
                </span>
                <input
                  key={imageInputKey}
                  id='image-file'
                  type='file'
                  className='sr-only'
                  accept={WORD_IMAGE.ACCEPTED_TYPES.join(',')}
                  onChange={(event) => {
                    selectImage(event.target.files?.item(0) ?? null);
                  }}
                />
              </label>

              {(selectedImagePreview || imageUrl) && (
                <div className='flex items-center gap-3 rounded-2xl border border-border bg-background/60 p-3'>
                  {/* The source can be a local blob preview or a Supabase public URL. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      selectedImagePreview ??
                      (editingId === null ? imageUrl : getWordImageRoute(editingId))
                    }
                    alt={t('words.manager.imagePreviewAlt')}
                    className='size-16 shrink-0 rounded-xl object-cover'
                  />
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium text-surface-foreground'>
                      {selectedImage?.name ?? t('words.manager.currentImage')}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {selectedImage
                        ? t('words.manager.readyToUpload')
                        : t('words.manager.uploadedImage')}
                    </p>
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='shrink-0 cursor-pointer rounded-full text-muted-foreground hover:bg-danger/10 hover:text-danger'
                    aria-label={t('words.manager.removeImage')}
                    onClick={removeImage}
                  >
                    <X aria-hidden='true' className='size-4' />
                  </Button>
                </div>
              )}
            </FormField>

            <Controller
              control={control}
              name='isPublic'
              render={({ field }) => (
                <Label
                  htmlFor='is-public'
                  className='flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background/60 p-4 sm:col-span-2'
                >
                  <Checkbox
                    ref={field.ref}
                    id='is-public'
                    name={field.name}
                    checked={field.value}
                    className='mt-0.5'
                    onBlur={field.onBlur}
                    onCheckedChange={field.onChange}
                  />
                  <span className='grid gap-1'>
                    <span className='text-sm font-medium text-surface-foreground'>
                      {t('words.manager.publicLabel')}
                    </span>
                    <span className='text-xs leading-5 font-normal text-muted-foreground'>
                      {t('words.manager.publicHint')}
                    </span>
                  </span>
                </Label>
              )}
            />

            <div className='flex flex-wrap gap-3 sm:col-span-2'>
              <Button
                type='submit'
                className='h-11 cursor-pointer rounded-lg bg-primary px-4 font-medium text-primary-foreground hover:bg-primary-hover disabled:cursor-wait'
                disabled={isSubmitting}
              >
                {editingId === null ? (
                  <Plus aria-hidden='true' className='size-4' />
                ) : (
                  <Save aria-hidden='true' className='size-4' />
                )}
                {editingId === null ? t('words.manager.create') : t('words.manager.update')}
              </Button>
              <DialogClose asChild>
                <Button
                  type='button'
                  variant='outline'
                  className='h-11 cursor-pointer rounded-lg border-border px-4 font-medium hover:bg-secondary-hover'
                >
                  <X aria-hidden='true' className='size-4' />
                  {t('words.manager.cancel')}
                </Button>
              </DialogClose>
            </div>
          </form>
        </DialogContent>
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

            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
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
              <div className='flex items-center justify-between gap-3 sm:justify-start'>
                <Badge
                  variant='secondary'
                  className='h-10 min-w-10 rounded-full bg-secondary-hover px-3 text-sm text-muted-foreground'
                >
                  {filteredWords.length}
                </Badge>
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

        {isLoading ? (
          <EmptyState>{t('words.manager.loading')}</EmptyState>
        ) : words.length === 0 ? (
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
                      : t('words.manager.privateBadge')}
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
                    <Tooltip align='end' label={t('words.manager.openPublicPage')}>
                      <Link
                        href={getSearchWordRoute(word.word)}
                        className='inline-flex size-9 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/12'
                        aria-label={`${t('words.manager.openPublicPage')}: ${word.word}`}
                      >
                        <Globe2 aria-hidden='true' className='size-4' />
                      </Link>
                    </Tooltip>
                  )}
                  <Tooltip label={t('words.manager.openDetails')}>
                    <Link
                      href={getWordRoute(word.id)}
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

function FormField({
  children,
  className = '',
  error,
  hint,
  id,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  error?: string;
  hint?: string;
  id: string;
  label: string;
}) {
  return (
    <div className={cn('grid content-start gap-2', className)}>
      <Label className='text-sm font-medium text-surface-foreground' htmlFor={id}>
        {label}
      </Label>
      {children}
      {hint && !error && <p className='text-xs text-muted-foreground'>{hint}</p>}
      {error && (
        <p className='text-sm text-danger' role='alert'>
          {error}
        </p>
      )}
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
