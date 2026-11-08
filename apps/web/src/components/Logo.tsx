import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Play className="size-4 fill-current" />
      </div>
      {withText && <span className="text-[15px] font-semibold tracking-tight">LoopScreen</span>}
    </div>
  );
}
