import {
  Tooltip as TooltipRoot,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type TooltipProps = {
  align?: 'center' | 'end' | 'start';
  children: React.ReactElement;
  label: string;
  side?: 'bottom' | 'top';
};

export function Tooltip({ align = 'center', children, label, side = 'top' }: TooltipProps) {
  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent align={align} side={side}>
          {label}
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
}
