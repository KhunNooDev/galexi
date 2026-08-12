'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenText, Menu, Tags } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

type AdminNavigationProps = {
  categoriesLabel: string;
  menuLabel: string;
  wordsLabel: string;
};

export function AdminNavigation({ categoriesLabel, menuLabel, wordsLabel }: AdminNavigationProps) {
  const pathname = usePathname();
  const items = [
    {
      href: ROUTES.MANAGE_WORDS,
      icon: BookOpenText,
      label: wordsLabel,
    },
    {
      href: ROUTES.MANAGE_CATEGORIES,
      icon: Tags,
      label: categoriesLabel,
    },
  ];

  return (
    <>
      <nav
        aria-label={menuLabel}
        className='hidden items-center gap-1 rounded-full border border-border bg-background/45 p-1 shadow-xs lg:flex'
      >
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary-hover hover:text-foreground',
                isActive &&
                  'bg-primary/12 text-primary shadow-xs hover:bg-primary/16 hover:text-primary',
              )}
            >
              <Icon aria-hidden='true' className='size-4' />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type='button'
            variant='outline'
            size='icon-lg'
            className='size-10 cursor-pointer rounded-full border-border bg-background/45 text-muted-foreground shadow-xs hover:bg-secondary-hover hover:text-foreground lg:hidden'
            aria-label={menuLabel}
          >
            <Menu aria-hidden='true' className='size-5' />
          </Button>
        </PopoverTrigger>
        <PopoverContent align='end' sideOffset={8} className='w-56 p-2 lg:hidden'>
          <nav aria-label={menuLabel} className='grid gap-1'>
            {items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-surface-foreground transition-colors hover:bg-secondary-hover',
                    isActive && 'bg-primary/12 text-primary',
                  )}
                >
                  <Icon aria-hidden='true' className='size-4' />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </PopoverContent>
      </Popover>
    </>
  );
}
