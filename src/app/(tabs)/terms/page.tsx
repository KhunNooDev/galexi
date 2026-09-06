import { getTranslations } from 'next-intl/server';

import { LegalPage } from '@/components/legal-page';

export default async function TermsPage() {
  const t = await getTranslations('legal');

  return (
    <LegalPage
      backLabel={t('backHome')}
      intro={t('terms.intro')}
      lastUpdated={t('lastUpdated')}
      title={t('terms.title')}
      sections={[
        { title: t('terms.accountTitle'), body: t('terms.accountBody') },
        { title: t('terms.useTitle'), body: t('terms.useBody') },
        { title: t('terms.serviceTitle'), body: t('terms.serviceBody') },
      ]}
    />
  );
}
