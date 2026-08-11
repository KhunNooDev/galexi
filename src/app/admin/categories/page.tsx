import { redirect } from 'next/navigation';

import { PageHeader } from '@/components/page-header';
import { QueryProvider } from '@/components/query-provider';
import { USER_ROLE } from '@/constants/role';
import { AUTH_ROUTES, ROUTES } from '@/constants/routes';
import { CategoryManager } from '@/features/categories/components/category-manager';
import { listCategories } from '@/features/categories/server/category.service';
import { getCurrentUserClaims } from '@/lib/supabase/auth';
import { getUserRole } from '@/server/roles';

export default async function ManageCategoriesPage() {
  const claims = await getCurrentUserClaims();
  if (!claims) redirect(AUTH_ROUTES.SIGN_IN);
  if ((await getUserRole(claims.sub)) !== USER_ROLE.ADMIN) redirect(ROUTES.CATEGORIES);
  const categories = await listCategories();

  return (
    <main className='relative min-h-svh overflow-x-clip bg-background pb-10'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute -top-40 left-1/3 size-96 rounded-full bg-primary/10 blur-3xl' />
        <div className='absolute top-72 -right-40 size-96 rounded-full bg-[#22d3ee]/8 blur-3xl' />
      </div>

      <div className='relative mx-auto max-w-7xl'>
        <PageHeader
          brand
          isAdmin
          user={{ email: typeof claims.email === 'string' ? claims.email : undefined }}
        />
        <div className='px-4 py-8 sm:px-8 lg:py-10'>
          <QueryProvider>
            <CategoryManager initialCategories={categories} />
          </QueryProvider>
        </div>
      </div>
    </main>
  );
}
