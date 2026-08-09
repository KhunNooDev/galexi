import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/page-header';
import { QueryProvider } from '@/components/query-provider';
import { WordManager } from '@/components/word-manager';
import { USER_ROLE } from '@/constants/role';
import { AUTH_ROUTES, ROUTES } from '@/constants/routes';
import { getCurrentUserClaims } from '@/lib/supabase/auth';
import { listCategories } from '@/server/categories';
import { getUserRole } from '@/server/roles';
import { listWords } from '@/server/words';

export default async function WordsPage() {
  const claims = await getCurrentUserClaims();

  if (!claims) {
    redirect(AUTH_ROUTES.SIGN_IN);
  }

  if ((await getUserRole(claims.sub)) !== USER_ROLE.ADMIN) {
    redirect(ROUTES.SEARCH_WORDS);
  }

  const [t, words, categories] = await Promise.all([
    getTranslations(),
    listWords(),
    listCategories(),
  ]);

  return (
    <main className='relative min-h-svh overflow-x-clip bg-background px-4 pb-4 sm:px-8 sm:pb-8'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute -top-40 left-1/3 size-96 rounded-full bg-primary/10 blur-3xl' />
        <div className='absolute top-72 -right-40 size-96 rounded-full bg-[#22d3ee]/8 blur-3xl' />
      </div>

      <div className='relative mx-auto max-w-7xl'>
        <PageHeader
          backHref={ROUTES.HOME}
          backLabel={t('words.backHome')}
          className='mb-6'
          user={{ email: typeof claims.email === 'string' ? claims.email : undefined }}
        />

        <div className='mx-auto max-w-6xl'>
          <QueryProvider>
            <WordManager initialWords={words} categories={categories} />
          </QueryProvider>
        </div>
      </div>
    </main>
  );
}
