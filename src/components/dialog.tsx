'use client';

import { type ReactNode } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog as DialogRoot,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type DialogProps = {
  children: ReactNode;
  className?: string;
  closeDisabled?: boolean;
  closeLabel: string;
  description?: ReactNode;
  initialFocusId?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  size?: 'lg' | 'md' | 'sm' | 'xl';
  title: ReactNode;
};

const sizeClassNames = {
  lg: 'max-w-2xl sm:max-w-2xl',
  md: 'max-w-lg sm:max-w-lg',
  sm: 'max-w-sm sm:max-w-sm',
  xl: 'max-w-4xl sm:max-w-4xl',
} as const;

export function Dialog({
  children,
  className,
  closeDisabled = false,
  closeLabel,
  description,
  initialFocusId,
  onOpenChange,
  open,
  size = 'md',
  title,
}: DialogProps) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent
        {...(description ? {} : { 'aria-describedby': undefined })}
        showCloseButton={false}
        className={cn(
          'max-h-[calc(100svh-2rem)] gap-0 overflow-hidden rounded-3xl border-border bg-surface p-0 text-surface-foreground shadow-2xl',
          sizeClassNames[size],
          className,
        )}
        onOpenAutoFocus={(event) => {
          if (!initialFocusId) {
            return;
          }

          event.preventDefault();
          document.getElementById(initialFocusId)?.focus();
        }}
      >
        <DialogHeader className='flex-row items-center justify-between gap-3 border-b border-border px-5 py-2 text-left sm:px-6'>
          <div className='min-w-0'>
            <DialogTitle className='truncate text-lg text-surface-foreground'>{title}</DialogTitle>
            {description && <DialogDescription className='mt-1'>{description}</DialogDescription>}
          </div>
          <Button
            type='button'
            variant='ghost'
            size='icon-lg'
            className='shrink-0 cursor-pointer rounded-full text-muted-foreground hover:bg-secondary-hover hover:text-foreground'
            aria-label={closeLabel}
            disabled={closeDisabled}
            onClick={() => onOpenChange(false)}
          >
            <X aria-hidden='true' className='size-5' />
          </Button>
        </DialogHeader>
        {children}
      </DialogContent>
    </DialogRoot>
  );
}
