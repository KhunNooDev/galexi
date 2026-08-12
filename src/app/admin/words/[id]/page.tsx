import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/page-header';
import { IDENTITY_KIND } from '@/constants/identity';
import { AUTH_ROUTES, ROUTES } from '@/constants/routes';
import { WordFlashcard } from '@/features/words/components/word-flashcard';
import { getWordById } from '@/features/words/server/word.service';
import { getCurrentIdentity } from '@/lib/supabase/auth';

export default async function ManageWordDetailsPage({ params }: PageProps<'/admin/words/[id]'>) {
  const identity = await getCurrentIdentity();

  if (identity.kind === IDENTITY_KIND.PUBLIC || identity.kind === IDENTITY_KIND.GUEST) {
    redirect(AUTH_ROUTES.SIGN_IN);
  }

  if (identity.kind !== IDENTITY_KIND.ADMIN) {
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
          identity={identity}
        />

        <div className='px-4 py-8 sm:px-8 lg:py-10'>
          <WordFlashcard word={word} />
        </div>
      </div>
    </main>
  );
}
