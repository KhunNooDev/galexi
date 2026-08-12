import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/page-header';
import { USER_ROLE } from '@/constants/role';
import { AUTH_ROUTES, ROUTES } from '@/constants/routes';
import { WordFlashcard } from '@/features/words/components/word-flashcard';
import { getWordById } from '@/features/words/server/word.service';
import { getCurrentUserClaims } from '@/lib/supabase/auth';
import { getUserRole } from '@/server/roles';

export default async function ManageWordDetailsPage({ params }: PageProps<'/admin/words/[id]'>) {
  const claims = await getCurrentUserClaims();

  if (!claims) {
    redirect(AUTH_ROUTES.SIGN_IN);
  }

  if ((await getUserRole(claims.sub)) !== USER_ROLE.ADMIN) {
    redirect(ROUTES.PUBLIC_WORDS);
  }

  const { id: idParam } = await params;
  const id = Number(idParam);

  if (!Number.isSafeInteger(id) || id <= 0) {
    notFound();
  }

  const word = await getWordById(id);

  if (!word) {
    notFound();
  }

  const t = await getTranslations();

  return (
    <main className='min-h-svh bg-background pb-10'>
      <div className='mx-auto max-w-7xl'>
        <PageHeader
          backHref={ROUTES.MANAGE_WORDS}
          backLabel={t('words.flashcard.backToWords')}
          isAdmin
          user={{ email: typeof claims.email === 'string' ? claims.email : undefined }}
        />

        <div className='px-4 py-8 sm:px-8 lg:py-10'>
          <WordFlashcard word={word} />
        </div>
      </div>
    </main>
  );
}
