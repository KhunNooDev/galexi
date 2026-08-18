'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { CircleAlert, RotateCcw } from 'lucide-react';

import type { SaveAccountState } from '@/app/learn/save/actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type RetryTransferButtonProps = {
  action: () => Promise<SaveAccountState>;
};

export function RetryTransferButton({ action }: RetryTransferButtonProps) {
  const t = useTranslations('learning.saveAccount');
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className='space-y-3'>
      {state.error && (
        <Alert variant='destructive' className='rounded-2xl border-danger/30 bg-danger/10'>
          <CircleAlert aria-hidden='true' />
          <AlertDescription className='text-danger'>{state.error}</AlertDescription>
        </Alert>
      )}
      <Button type='submit' className='h-12 w-full rounded-2xl' disabled={pending}>
        <RotateCcw aria-hidden='true' className={pending ? 'animate-spin' : ''} />
        {pending ? t('saving') : t('tryAgain')}
      </Button>
    </form>
  );
}
