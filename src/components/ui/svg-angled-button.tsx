import * as React from 'react';
import { cn } from '@/lib/utils';

const BUTTON_BG_URL = 'https://iili.io/K00ickF.png';

interface SvgAngledButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const SvgAngledButton = React.forwardRef<HTMLButtonElement, SvgAngledButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          'h-19 relative inline-flex w-36 items-center justify-center overflow-hidden border-0 bg-transparent transition-all duration-200 hover:scale-105 disabled:pointer-events-none disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
        style={{
          backgroundImage: `url(${BUTTON_BG_URL})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          width: '144px',
          height: '76px',
        }}
      >
        {/* Animated gradient overlay */}
        <div className="button-gradient-overlay" />
        <span
          className="relative z-10 flex items-center gap-2 text-2xl font-medium text-white"
          style={{ transform: 'skewY(-4deg)' }}
        >
          {children}
        </span>
      </button>
    );
  },
);

SvgAngledButton.displayName = 'SvgAngledButton';

export { SvgAngledButton };
