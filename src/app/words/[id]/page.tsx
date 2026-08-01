import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import { WordFlashcard } from '@/components/word-flashcard';
import { USER_ROLE } from '@/constants/role';
import { AUTH_ROUTES, ROUTES } from '@/constants/routes';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { getUserRole } from '@/server/roles';
import { getWordById } from '@/server/words';

export default async function WordDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  if (!Number.isSafeInteger(id) || id <= 0) {
    notFound();
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    redirect(AUTH_ROUTES.SIGN_IN);
  }

  if ((await getUserRole(userId)) !== USER_ROLE.ADMIN) {
    redirect(ROUTES.SEARCH_WORDS);
  }

  const word = await getWordById(id);

  if (!word) {
    notFound();
  }

  const t = await getTranslations();

  return (
    <main className='min-h-full bg-background px-4 py-6 sm:px-8 sm:py-10'>
      <div className='mx-auto max-w-5xl'>
        <header className='mb-8 flex items-center justify-between gap-4'>
          <Link
            href={ROUTES.WORDS}
            className='inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
          >
            <ArrowLeft aria-hidden='true' className='size-4' />
            {t('words.flashcard.backToWords')}
          </Link>
          <ThemeToggle label={t('home.themeToggle')} />
        </header>

        <WordFlashcard word={word} />
      </div>
    </main>
  );
}
