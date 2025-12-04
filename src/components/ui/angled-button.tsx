import * as React from 'react';
import { cn } from '@/lib/utils';

interface AngledButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const AngledButton = React.forwardRef<HTMLButtonElement, AngledButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          'relative inline-flex items-center justify-center overflow-hidden border-0 bg-white px-6 py-3 text-sm font-medium text-black transition-all duration-200 hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-50',
          '-skew-x-3 transform hover:scale-105',
          className,
        )}
        ref={ref}
        {...props}
        style={{
          clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
        }}
      >
        <span className="skew-x-3 transform" style={{ transform: 'skewX(3deg) skewY(-4deg)' }}>
          {children}
        </span>
      </button>
    );
  },
);

AngledButton.displayName = 'AngledButton';

export { AngledButton };
