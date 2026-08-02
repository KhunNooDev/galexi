import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/page-header';
import { WordFlashcard } from '@/components/word-flashcard';
import { USER_ROLE } from '@/constants/role';
import { AUTH_ROUTES, ROUTES } from '@/constants/routes';
import { getCurrentUserClaims } from '@/lib/supabase/auth';
import { getUserRole } from '@/server/roles';
import { getWordById } from '@/server/words';

export default async function WordDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  if (!Number.isSafeInteger(id) || id <= 0) {
    notFound();
  }

  const claims = await getCurrentUserClaims();

  if (!claims) {
    redirect(AUTH_ROUTES.SIGN_IN);
  }

  if ((await getUserRole(claims.sub)) !== USER_ROLE.ADMIN) {
    redirect(ROUTES.SEARCH_WORDS);
  }

  const word = await getWordById(id);

  if (!word) {
    notFound();
  }

  const t = await getTranslations();

  return (
    <main className='min-h-svh bg-background px-4 pb-6 sm:px-8 sm:pb-10'>
      <div className='mx-auto max-w-7xl'>
        <PageHeader
          backHref={ROUTES.WORDS}
          backLabel={t('words.flashcard.backToWords')}
          className='mb-8'
          user={{ email: typeof claims.email === 'string' ? claims.email : undefined }}
        />

        <WordFlashcard word={word} />
      </div>
    </main>
  );
}
