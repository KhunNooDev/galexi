'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { WORD_LIMITS } from '@/constants/word';
import { DeleteWordDialog } from '@/features/words/components/delete-word-dialog';
import { DiscardWordChangesDialog } from '@/features/words/components/discard-word-changes-dialog';
import { WordCollection } from '@/features/words/components/word-collection';
import { WordFormDialog } from '@/features/words/components/word-form-dialog';
import { WordManagerToolbar } from '@/features/words/components/word-manager-toolbar';
import { WordPagination, type WordView } from '@/features/words/components/word-pagination';
import { useWordImageUpload } from '@/features/words/use-word-image-upload';
import type { AdminWord } from '@/features/words/word.api';
import {
  useCreateWord,
  useDeleteWord,
  useUpdateWord,
  useWords,
} from '@/features/words/word.queries';
import { createWordFormSchema, type WordFormValues } from '@/features/words/word.schema';
import { ApiError } from '@/lib/api/errors';

const defaultValues: WordFormValues = {
  word: '',
  pronunciationIpa: '',
  pronunciationThai: '',
  partOfSpeech: '',
  meaningsTh: [],
  exampleSentence: '',
  exampleSentenceMeaningTh: '',
  imageUrl: '',
  isPublic: false,
  categoryIds: [],
};

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
  const imageUpload = useWordImageUpload({
    invalidTypeMessage: t('words.manager.validation.invalidImageType'),
    imageTooLargeMessage: t('words.manager.validation.imageTooLarge'),
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [partOfSpeechFilter, setPartOfSpeechFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [view, setView] = useState<WordView>('grid');
  const [requestError, setRequestError] = useState<string | null>(null);
  const [wordToDelete, setWordToDelete] = useState<AdminWord | null>(null);
  const form = useForm<WordFormValues, unknown, WordFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const words = wordsQuery.data;
  const deletingId = deleteWordMutation.isPending ? deleteWordMutation.variables : null;
  const isSaving =
    form.formState.isSubmitting || createWordMutation.isPending || updateWordMutation.isPending;
  const dialogApiError = createWordMutation.error ?? updateWordMutation.error;
  const dialogRequestError =
    imageUpload.imageError ??
    requestError ??
    (dialogApiError instanceof ApiError && dialogApiError.status === 409
      ? t('words.manager.validation.duplicateWord')
      : dialogApiError
        ? t('words.manager.requestError')
        : null);
  const deleteRequestError = deleteWordMutation.error ? t('words.manager.requestError') : null;
  const pageRequestError = wordsQuery.error ? t('words.manager.requestError') : null;

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
  const totalPages = Math.max(1, Math.ceil(filteredWords.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedWords = filteredWords.slice((activePage - 1) * pageSize, activePage * pageSize);

  function resetForm() {
    setEditingId(null);
    imageUpload.clearImage();
    form.reset(defaultValues);
  }

  function clearFormErrors() {
    setRequestError(null);
    imageUpload.clearImageError();
    createWordMutation.reset();
    updateWordMutation.reset();
  }

  function clearDeleteError() {
    deleteWordMutation.reset();
  }

  function openCreateDialog() {
    clearFormErrors();
    resetForm();
    setIsDialogOpen(true);
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

    if (form.formState.isDirty || imageUpload.selectedImage !== null) {
      setIsDiscardDialogOpen(true);
      return;
    }

    closeDialog();
  }

  function selectImage(file: File | null) {
    clearFormErrors();
    imageUpload.selectImage(file);
  }

  async function saveWord(values: WordFormValues) {
    clearFormErrors();
    let uploadedImagePath: string | null = null;

    try {
      uploadedImagePath = await imageUpload.uploadSelectedImage();
      const nextValues = uploadedImagePath ? { ...values, imageUrl: uploadedImagePath } : values;

      if (editingId !== null) {
        await updateWordMutation.mutateAsync({ id: editingId, values: nextValues });
        closeDialog();
        return;
      }

      await createWordMutation.mutateAsync(nextValues);
      closeDialog();
    } catch (error) {
      if (uploadedImagePath) {
        await imageUpload.requestCandidateCleanup(uploadedImagePath);
      }

      if (!(error instanceof ApiError)) {
        setRequestError(t('words.manager.requestError'));
      }
    }
  }

  function editWord(word: AdminWord) {
    clearFormErrors();
    imageUpload.clearImage();
    setEditingId(word.id);
    form.reset({
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
    setIsDialogOpen(true);
  }

  async function deleteWord(id: number) {
    clearDeleteError();

    try {
      await deleteWordMutation.mutateAsync(id);

      if (editingId === id) {
        resetForm();
      }

      setWordToDelete(null);
    } catch {
      // The mutation exposes a normalized error for the delete dialog.
    }
  }

  return (
    <div className='space-y-6'>
      {pageRequestError && (
        <Alert
          variant='destructive'
          className='rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger'
        >
          <AlertDescription className='text-danger'>{pageRequestError}</AlertDescription>
        </Alert>
      )}

      <DeleteWordDialog
        word={wordToDelete}
        pending={deletingId !== null}
        error={deleteRequestError}
        onCancel={() => setWordToDelete(null)}
        onConfirm={(id) => void deleteWord(id)}
      />
      <DiscardWordChangesDialog
        open={isDiscardDialogOpen}
        onOpenChange={setIsDiscardDialogOpen}
        onDiscard={closeDialog}
      />
      <WordFormDialog
        open={isDialogOpen}
        editingId={editingId}
        form={form}
        categories={categories}
        selectedImage={imageUpload.selectedImage}
        selectedImagePreview={imageUpload.previewUrl}
        requestError={dialogRequestError}
        saving={isSaving}
        onImageChange={selectImage}
        onRequestClose={requestCloseDialog}
        onSubmit={saveWord}
      />

      <section className='space-y-4' aria-labelledby='word-list-title'>
        <WordManagerToolbar
          resultCount={filteredWords.length}
          categories={categories}
          categoryFilter={categoryFilter}
          partOfSpeechFilter={partOfSpeechFilter}
          onSearch={(query) => {
            setSearchQuery(query);
            setCurrentPage(1);
          }}
          onCategoryFilterChange={(value) => {
            setCategoryFilter(value);
            setCurrentPage(1);
          }}
          onPartOfSpeechFilterChange={(value) => {
            setPartOfSpeechFilter(value);
            setCurrentPage(1);
          }}
          onCreate={openCreateDialog}
        />

        {filteredWords.length > 0 && (
          <WordPagination
            activePage={activePage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalResults={filteredWords.length}
            view={view}
            onPageChange={setCurrentPage}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setCurrentPage(1);
            }}
            onViewChange={setView}
          />
        )}

        <WordCollection
          allWordsCount={words.length}
          filteredWordsCount={filteredWords.length}
          words={paginatedWords}
          view={view}
          deletingId={deletingId}
          onEdit={editWord}
          onDelete={(word) => {
            clearDeleteError();
            setWordToDelete(word);
          }}
        />
      </section>
    </div>
  );
}
