import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { CategoryManager } from '@/components/category-manager';
import { PageHeader } from '@/components/page-header';
import { QueryProvider } from '@/components/query-provider';
import { USER_ROLE } from '@/constants/role';
import { AUTH_ROUTES, ROUTES } from '@/constants/routes';
import { getCurrentUserClaims } from '@/lib/supabase/auth';
import { listCategories } from '@/server/categories';
import { getUserRole } from '@/server/roles';

export default async function ManageCategoriesPage() {
  const claims = await getCurrentUserClaims();
  if (!claims) redirect(AUTH_ROUTES.SIGN_IN);
  if ((await getUserRole(claims.sub)) !== USER_ROLE.ADMIN) redirect(ROUTES.CATEGORIES);
  const [t, categories] = await Promise.all([getTranslations(), listCategories()]);

  return (
    <main className='min-h-svh bg-background pb-10'>
      <PageHeader
        backHref={ROUTES.MANAGE_WORDS}
        backLabel={t('categories.manager.backToWords')}
        user={{ email: typeof claims.email === 'string' ? claims.email : undefined }}
      />
      <div className='mx-auto max-w-5xl px-4 py-8 sm:px-8'>
        <QueryProvider>
          <CategoryManager initialCategories={categories} />
        </QueryProvider>
      </div>
    </main>
  );
}
