import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { AdminManagerSkeleton } from '@/components/admin-loading-skeleton';
import { PageHeader } from '@/components/page-header';
import { QueryProvider } from '@/components/query-provider';
import { IDENTITY_KIND } from '@/constants/identity';
import { AUTH_ROUTES, ROUTES } from '@/constants/routes';
import { DEFAULT_CATEGORY_LIST_PARAMS } from '@/features/categories/category-list';
import { CategoryManager } from '@/features/categories/components/category-manager';
import { listCategoryPage } from '@/features/categories/server/category.service';
import { getCurrentIdentity } from '@/lib/supabase/auth';

export default async function ManageCategoriesPage() {
  const identity = await getCurrentIdentity();
  if (identity.kind === IDENTITY_KIND.PUBLIC || identity.kind === IDENTITY_KIND.GUEST) {
    redirect(AUTH_ROUTES.SIGN_IN);
  }
  if (identity.kind !== IDENTITY_KIND.ADMIN) redirect(ROUTES.CATEGORIES);

  return (
    <main className='relative min-h-svh overflow-x-clip bg-background pb-10'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute -top-40 left-1/3 size-96 rounded-full bg-primary/10 blur-3xl' />
        <div className='absolute top-72 -right-40 size-96 rounded-full bg-[#22d3ee]/8 blur-3xl' />
      </div>

      <div className='relative mx-auto max-w-7xl'>
        <PageHeader brand identity={identity} />
        <div className='px-4 py-8 sm:px-8 lg:py-10'>
          <Suspense fallback={<AdminManagerSkeleton kind='categories' />}>
            <CategoriesContent />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

async function CategoriesContent() {
  const categoryPage = await listCategoryPage(DEFAULT_CATEGORY_LIST_PARAMS);

  return (
    <QueryProvider>
      <CategoryManager initialPage={categoryPage} />
    </QueryProvider>
  );
}
