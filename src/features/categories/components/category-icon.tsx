import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  CalendarRange,
  CarFront,
  CloudSun,
  DoorOpen,
  Hash,
  Palette,
  PawPrint,
  Salad,
  Shirt,
  Sparkles,
  UsersRound,
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  animals: PawPrint,
  clothes: Shirt,
  colors: Palette,
  days: CalendarDays,
  family: UsersRound,
  food: Salad,
  months: CalendarRange,
  numbers: Hash,
  rooms: DoorOpen,
  transportation: CarFront,
  weather: CloudSun,
};

export function CategoryIcon({ className, slug }: { className?: string; slug: string }) {
  const Icon = icons[slug] ?? Sparkles;
  return <Icon aria-hidden='true' className={className} />;
}
