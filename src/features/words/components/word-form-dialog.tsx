'use client';

import { type UseFormReturn, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { BookOpenText, Globe2, Plus, Save, X } from 'lucide-react';

import { Dialog } from '@/components/dialog';
import { createFormInputs, Form } from '@/components/form';
import { ImageWithSkeleton } from '@/components/image-with-skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PART_OF_SPEECH_OPTIONS } from '@/constants/part-of-speech';
import { getWordImageRoute } from '@/constants/routes';
import { WORD_IMAGE, WORD_LIMITS } from '@/constants/word';
import type { WordFormValues } from '@/features/words/word.schema';

const {
  InputCheckbox,
  InputCombobox,
  InputFile,
  InputMultiCombobox,
  InputTags,
  InputText,
  InputTextarea,
} = createFormInputs<WordFormValues>();

type WordFormDialogProps = {
  open: boolean;
  editingId: number | null;
  form: UseFormReturn<WordFormValues, unknown, WordFormValues>;
  categories: { id: number; name: string }[];
  selectedImage: File | null;
  selectedImagePreview: string | null;
  requestError: string | null;
  saving: boolean;
  onImageChange: (file: File | null) => void;
  onRequestClose: () => void;
  onSubmit: (values: WordFormValues) => Promise<void>;
};

export function WordFormDialog({
  open,
  editingId,
  form,
  categories,
  selectedImage,
  selectedImagePreview,
  requestError,
  saving,
  onImageChange,
  onRequestClose,
  onSubmit,
}: WordFormDialogProps) {
  const t = useTranslations();
  const imageUrl = useWatch({ control: form.control, name: 'imageUrl' });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onRequestClose();
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
      closeDisabled={saving}
      initialFocusId='word'
      size='xl'
      className='h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)]'
    >
      <Form
        className='flex min-h-0 flex-1 flex-col overflow-hidden'
        form={form}
        onSubmit={onSubmit}
      >
        <div className='min-h-0 flex-1 scrollbar-gutter-stable overflow-y-auto p-5 sm:p-6'>
          <div className='space-y-6'>
            {requestError && (
              <Alert
                variant='destructive'
                className='rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger'
              >
                <AlertDescription className='text-danger'>{requestError}</AlertDescription>
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
                  removeLabel={(meaning) => t('words.manager.removeMeaning', { meaning })}
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
                onFileChange={onImageChange}
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
                icon={<Globe2 aria-hidden='true' className='size-5' />}
              />
            </div>
          </div>
        </div>

        <div className='grid shrink-0 grid-cols-2 gap-3 border-t border-border bg-surface/95 px-5 py-4 backdrop-blur sm:flex sm:justify-end sm:px-6'>
          <Button
            type='button'
            variant='outline'
            className='h-11 w-full cursor-pointer rounded-lg border-border px-4 font-medium text-surface-foreground hover:bg-secondary-hover sm:w-auto'
            disabled={saving}
            onClick={onRequestClose}
          >
            <X aria-hidden='true' className='size-4' />
            {t('words.manager.cancel')}
          </Button>
          <Button
            type='submit'
            className='h-11 w-full cursor-pointer rounded-lg bg-primary px-4 font-medium text-primary-foreground hover:bg-primary-hover disabled:cursor-wait sm:w-auto'
            disabled={saving}
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
  );
}
