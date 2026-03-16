import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';

interface TrueFalseViewProps {
    selectedOption?: string; // "TRUE" or "FALSE"
    onSelect: (option: string) => void;
    disabled?: boolean;
}

export const TrueFalseView = ({
    selectedOption,
    onSelect,
    disabled = false
}: TrueFalseViewProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['TRUE', 'FALSE'].map((option) => {
                const isTrue = option === 'TRUE';
                const isSelected = selectedOption === option;

                return (
                    <button
                        key={option}
                        onClick={() => !disabled && onSelect(option)}
                        disabled={disabled}
                        className={cn(
                            "h-48 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-4 group relative overflow-hidden",
                            isSelected
                                ? (isTrue ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(68,237,38,0.2)]" : "border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]")
                                : "border-surface-border bg-surface-dark/50 hover:bg-surface-dark",
                            disabled && "opacity-60 cursor-not-allowed"
                        )}
                    >
                        {/* Background Glow */}
                        <div className={cn(
                            "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500",
                            isTrue ? "bg-gradient-to-br from-primary to-transparent" : "bg-gradient-to-br from-red-500 to-transparent"
                        )} />

                        <div className={cn(
                            "text-6xl font-bold transition-transform duration-300 group-hover:scale-110",
                            isSelected
                                ? (isTrue ? "text-primary" : "text-red-500")
                                : "text-gray-600"
                        )}>
                            {isTrue ? "T" : "F"}
                        </div>

                        <div className={cn(
                            "text-xl font-medium tracking-widest",
                            isSelected
                                ? "text-text-main"
                                : "text-text-muted"
                        )}>
                            {isTrue ? "TRUE" : "FALSE"}
                        </div>

                        {isSelected && (
                            <div className="absolute top-4 right-4">
                                <Icon icon="lucide:check-circle" className={cn(
                                    "w-6 h-6",
                                    isTrue ? "text-primary" : "text-red-500"
                                )} />
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
