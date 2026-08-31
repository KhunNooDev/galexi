'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BookOpen, GraduationCap, Grid2X2, House, UserRound } from 'lucide-react';

import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

type ActiveTab = 'categories' | 'home' | 'learn' | 'profile' | 'words';

type MobileBottomNavigationProps = {
  active?: ActiveTab;
};

function getActiveTab(pathname: string): ActiveTab | undefined {
  if (pathname === ROUTES.HOME) return 'home';
  if (pathname.startsWith(ROUTES.LEARN_HOME)) return 'learn';
  if (pathname.startsWith(ROUTES.PUBLIC_WORDS)) return 'words';
  if (pathname.startsWith(ROUTES.CATEGORIES)) return 'categories';
  if (pathname.startsWith(ROUTES.PROFILE)) return 'profile';
  return undefined;
}

export function MobileBottomNavigation({ active }: MobileBottomNavigationProps = {}) {
  const pathname = usePathname();
  const t = useTranslations('navigation');
  const activeTab = active ?? getActiveTab(pathname);
  const items = [
    { href: ROUTES.HOME, icon: House, key: 'home', label: t('home') },
    { href: ROUTES.LEARN_HOME, icon: GraduationCap, key: 'learn', label: t('learn') },
    { href: ROUTES.PUBLIC_WORDS, icon: BookOpen, key: 'words', label: t('words') },
    {
      href: ROUTES.CATEGORIES,
      icon: Grid2X2,
      key: 'categories',
      label: t('categories'),
    },
    { href: ROUTES.PROFILE, icon: UserRound, key: 'profile', label: t('profile') },
  ] as const;

  return (
    <nav
      aria-label={t('label')}
      className='fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/96 pb-[env(safe-area-inset-bottom)] shadow-[0_-14px_40px_rgb(3_8_24/18%)] backdrop-blur-xl lg:hidden'
    >
      <div className='mx-auto grid h-18 max-w-xl grid-cols-5 px-2'>
        {items.map(({ href, icon: Icon, key, label }) => {
          const isActive = activeTab === key;

          return (
            <Link
              key={key}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[0.68rem] font-medium text-muted-foreground transition-colors focus-visible:ring-3 focus-visible:ring-focus/30 focus-visible:outline-none',
                isActive ? 'text-primary' : 'hover:text-foreground',
              )}
            >
              <span
                className={cn(
                  'grid h-7 min-w-10 place-items-center rounded-full transition-colors',
                  isActive && 'bg-primary/14',
                )}
              >
                <Icon aria-hidden='true' className='size-5' strokeWidth={isActive ? 2.4 : 1.9} />
              </span>
              <span className='truncate'>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
