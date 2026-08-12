'use client';

import Link from 'next/link';
import { LogIn, LogOut, UserRound } from 'lucide-react';

import { signOut } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AUTH_ROUTES, ROUTES } from '@/constants/routes';

type ProfileMenuProps = {
  accountMenuLabel: string;
  email?: string;
  isAuthenticated: boolean;
  profileLabel: string;
  signInLabel: string;
  signOutLabel: string;
};

export function ProfileMenu({
  accountMenuLabel,
  email,
  isAuthenticated,
  profileLabel,
  signInLabel,
  signOutLabel,
}: ProfileMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          size='icon-lg'
          className='size-10 cursor-pointer rounded-full border-border bg-surface text-muted-foreground shadow-sm hover:bg-secondary-hover hover:text-foreground dark:bg-surface dark:hover:bg-secondary-hover'
          aria-label={accountMenuLabel}
        >
          <UserRound aria-hidden='true' className='size-4' />
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' sideOffset={8} className='w-64 p-2'>
        {isAuthenticated ? (
          <>
            {email && (
              <div className='border-b border-border px-3 py-2.5'>
                <p className='truncate text-sm font-medium text-surface-foreground'>{email}</p>
              </div>
            )}
            <div className='py-1'>
              <Link
                href={ROUTES.PROFILE}
                className='flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-surface-foreground transition-colors hover:bg-secondary-hover'
              >
                <UserRound aria-hidden='true' className='size-4 text-muted-foreground' />
                {profileLabel}
              </Link>
              <form action={signOut}>
                <Button
                  type='submit'
                  variant='ghost'
                  className='h-10 w-full cursor-pointer justify-start rounded-lg px-3 text-surface-foreground hover:bg-secondary-hover'
                >
                  <LogOut aria-hidden='true' className='size-4 text-muted-foreground' />
                  {signOutLabel}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <Link
            href={AUTH_ROUTES.SIGN_IN}
            className='flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-surface-foreground transition-colors hover:bg-secondary-hover'
          >
            <LogIn aria-hidden='true' className='size-4 text-muted-foreground' />
            {signInLabel}
          </Link>
        )}
      </PopoverContent>
    </Popover>
  );
}
