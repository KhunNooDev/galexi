'use client';

import { useTranslations } from 'next-intl';
import { TriangleAlert } from 'lucide-react';

import { AlertDialog } from '@/components/alert-dialog';

export function DiscardWordChangesDialog({
  open,
  onOpenChange,
  onDiscard,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
}) {
  const t = useTranslations();

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<TriangleAlert aria-hidden='true' className='size-5' />}
      title={t('words.manager.discardDialogTitle')}
      description={t('words.manager.discardDialogDescription')}
      cancelLabel={t('words.manager.keepEditing')}
      actionLabel={t('words.manager.discardChanges')}
      actionVariant='destructive'
      tone='warning'
      onAction={onDiscard}
    />
  );
}
