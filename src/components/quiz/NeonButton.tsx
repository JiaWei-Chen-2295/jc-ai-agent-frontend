import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'ghost' | 'outline';
    fullWidth?: boolean;
}

export const NeonButton = ({
    children,
    className,
    variant = 'primary',
    fullWidth = false,
    ...props
}: NeonButtonProps) => {
    const baseStyles = "rounded-lg font-bold py-3 px-6 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-primary text-white hover:bg-primary-hover shadow-[0_0_15px_rgba(68,237,38,0.25)] hover:shadow-[0_0_25px_rgba(68,237,38,0.4)] drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]",
        ghost: "bg-transparent text-text-main hover:bg-white/5",
        outline: "border border-surface-border text-text-main hover:border-primary/50 hover:text-primary bg-transparent",
    };

    return (
        <button
            className={cn(
                baseStyles,
                variants[variant],
                fullWidth ? "w-full" : "",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
};
