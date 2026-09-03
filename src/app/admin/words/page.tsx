import { redirect } from 'next/navigation';

import { PageHeader } from '@/components/page-header';
import { QueryProvider } from '@/components/query-provider';
import { IDENTITY_KIND } from '@/constants/identity';
import { AUTH_ROUTES, ROUTES } from '@/constants/routes';
import { listCategories } from '@/features/categories/server/category.service';
import { WordManager } from '@/features/words/components/word-manager';
import { listWords } from '@/features/words/server/word.service';
import { DEFAULT_WORD_LIST_PARAMS } from '@/features/words/word-list';
import { getCurrentIdentity } from '@/lib/supabase/auth';

export default async function ManageWordsPage() {
  const identity = await getCurrentIdentity();

  if (identity.kind === IDENTITY_KIND.PUBLIC || identity.kind === IDENTITY_KIND.GUEST) {
    redirect(AUTH_ROUTES.SIGN_IN);
  }

  if (identity.kind !== IDENTITY_KIND.ADMIN) {
    redirect(ROUTES.PUBLIC_WORDS);
  }

  const [wordPage, categories] = await Promise.all([
    listWords(DEFAULT_WORD_LIST_PARAMS),
    listCategories(),
  ]);

  return (
    <main className='relative min-h-svh overflow-x-clip bg-background pb-10'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute -top-40 left-1/3 size-96 rounded-full bg-primary/10 blur-3xl' />
        <div className='absolute top-72 -right-40 size-96 rounded-full bg-[#22d3ee]/8 blur-3xl' />
      </div>

      <div className='relative mx-auto max-w-7xl'>
        <PageHeader brand identity={identity} />

        <div className='px-4 py-8 sm:px-8 lg:py-10'>
          <QueryProvider>
            <WordManager initialPage={wordPage} categories={categories} />
          </QueryProvider>
        </div>
      </div>
    </main>
  );
}
