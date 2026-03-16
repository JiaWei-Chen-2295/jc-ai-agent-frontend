import type { ReactNode } from 'react';
import { cn } from '@/lib/utils'; // Assuming generic utility exists or I should create it

// Simple utility if clsx/tailwind-merge setup isn't standard in project yet
// But I'll define a local utils.ts or assume common pattern.
// Let's create 'src/lib/utils.ts' as well in this batch.

interface NeonCardProps {
    children: ReactNode;
    className?: string;
    glow?: boolean;
}

export const NeonCard = ({ children, className, glow = false }: NeonCardProps) => {
    return (
        <div
            className={cn(
                "bg-surface-dark border border-surface-border rounded-xl p-6 transition-all duration-300",
                glow && "shadow-glow border-primary/50",
                className
            )}
        >
            {children}
        </div>
    );
};
