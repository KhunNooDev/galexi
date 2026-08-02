'use client';

import { type ComponentProps, type ReactNode } from 'react';

import {
  AlertDialog as AlertDialogRoot,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AlertDialogProps = {
  actionDisabled?: boolean;
  actionIcon?: ReactNode;
  actionLabel: string;
  actionVariant?: ComponentProps<typeof Button>['variant'];
  cancelDisabled?: boolean;
  cancelLabel: string;
  children?: ReactNode;
  closeOnAction?: boolean;
  description: ReactNode;
  icon?: ReactNode;
  onAction: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  pending?: boolean;
  title: ReactNode;
  tone?: 'danger' | 'default' | 'warning';
};

const toneClassNames = {
  danger: 'bg-danger/10 text-danger',
  default: 'bg-primary/10 text-primary',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
} as const;

export function AlertDialog({
  actionDisabled = false,
  actionIcon,
  actionLabel,
  actionVariant = 'default',
  cancelDisabled = false,
  cancelLabel,
  children,
  closeOnAction = true,
  description,
  icon,
  onAction,
  onOpenChange,
  open,
  pending = false,
  title,
  tone = 'default',
}: AlertDialogProps) {
  const actionClassName = cn(
    'h-10 cursor-pointer rounded-lg px-4 disabled:cursor-wait',
    actionVariant === 'destructive' && 'bg-danger text-danger-foreground hover:bg-danger-hover',
  );
  const action = closeOnAction ? (
    <AlertDialogAction
      variant={actionVariant}
      className={actionClassName}
      disabled={actionDisabled || pending}
      onClick={onAction}
    >
      {actionIcon}
      {actionLabel}
    </AlertDialogAction>
  ) : (
    <Button
      type='button'
      variant={actionVariant}
      className={actionClassName}
      disabled={actionDisabled || pending}
      onClick={onAction}
    >
      {actionIcon}
      {actionLabel}
    </Button>
  );

  return (
    <AlertDialogRoot open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='max-w-sm gap-5 rounded-2xl border-border bg-surface p-5 text-surface-foreground shadow-2xl sm:max-w-sm sm:p-6'>
        <AlertDialogHeader>
          {icon && (
            <AlertDialogMedia className={cn('mb-0 size-11 rounded-xl', toneClassNames[tone])}>
              {icon}
            </AlertDialogMedia>
          )}
          <AlertDialogTitle className='text-lg text-surface-foreground'>{title}</AlertDialogTitle>
          <AlertDialogDescription className='leading-5'>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter className='gap-2'>
          <AlertDialogCancel
            className='h-10 cursor-pointer rounded-lg border-border px-4 hover:bg-secondary-hover'
            disabled={cancelDisabled || pending}
          >
            {cancelLabel}
          </AlertDialogCancel>
          {action}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialogRoot>
  );
}
