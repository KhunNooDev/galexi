import { MobileBottomNavigation } from '@/components/mobile-bottom-navigation';
import { PageHeader } from '@/components/page-header';

export default function TabLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <PageHeader brand />
      {children}
      <MobileBottomNavigation />
    </>
  );
}
