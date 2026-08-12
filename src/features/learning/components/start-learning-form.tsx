'use client';

import { useActionState } from 'react';
import { ArrowRight, CircleAlert, LoaderCircle } from 'lucide-react';

import { startLearning } from '@/app/learn/start/actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type StartLearningFormProps = {
  className?: string;
  label: string;
  pendingLabel: string;
};

export function StartLearningForm({ className, label, pendingLabel }: StartLearningFormProps) {
  const [state, formAction, pending] = useActionState(startLearning, {});

  return (
    <form action={formAction} className={cn('flex flex-col items-center gap-3', className)}>
      <Button
        className='h-12 rounded-full px-6 text-base shadow-lg shadow-primary/20'
        disabled={pending}
        type='submit'
      >
        {pending ? (
          <LoaderCircle aria-hidden='true' className='animate-spin motion-reduce:animate-none' />
        ) : (
          <ArrowRight aria-hidden='true' />
        )}
        {pending ? pendingLabel : label}
      </Button>
      {state.error && (
        <Alert
          className='max-w-md border-danger/30 bg-danger/10 text-left text-danger'
          role='alert'
        >
          <CircleAlert aria-hidden='true' />
          <AlertDescription className='text-danger'>{state.error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
