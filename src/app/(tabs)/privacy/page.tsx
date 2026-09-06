import { getTranslations } from 'next-intl/server';

import { LegalPage } from '@/components/legal-page';

export default async function PrivacyPage() {
  const t = await getTranslations('legal');

  return (
    <LegalPage
      backLabel={t('backHome')}
      intro={t('privacy.intro')}
      lastUpdated={t('lastUpdated')}
      title={t('privacy.title')}
      sections={[
        { title: t('privacy.collectTitle'), body: t('privacy.collectBody') },
        { title: t('privacy.purposeTitle'), body: t('privacy.purposeBody') },
        { title: t('privacy.securityTitle'), body: t('privacy.securityBody') },
      ]}
    />
  );
}
