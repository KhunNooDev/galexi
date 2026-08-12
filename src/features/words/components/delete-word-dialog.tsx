'use client';

import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';

import { AlertDialog } from '@/components/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { AdminWord } from '@/features/words/word.api';

type DeleteWordDialogProps = {
  word: AdminWord | null;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (id: number) => void;
};

export function DeleteWordDialog({
  word,
  pending,
  error,
  onCancel,
  onConfirm,
}: DeleteWordDialogProps) {
  const t = useTranslations();

  return (
    <AlertDialog
      open={Boolean(word)}
      onOpenChange={(open) => {
        if (!open && !pending) {
          onCancel();
        }
      }}
      icon={<Trash2 aria-hidden='true' className='size-5' />}
      title={t('words.manager.deleteDialogTitle')}
      description={t('words.manager.deleteDialogDescription', { word: word?.word ?? '' })}
      cancelLabel={t('words.manager.cancel')}
      actionLabel={t('words.manager.confirmDelete')}
      actionIcon={<Trash2 aria-hidden='true' className='size-4' />}
      actionVariant='destructive'
      actionDisabled={!word}
      pending={pending}
      closeOnAction={false}
      tone='danger'
      onAction={() => {
        if (word) {
          onConfirm(word.id);
        }
      }}
    >
      {error && (
        <Alert
          variant='destructive'
          className='rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger'
        >
          <AlertDescription className='text-danger'>{error}</AlertDescription>
        </Alert>
      )}
    </AlertDialog>
  );
}
