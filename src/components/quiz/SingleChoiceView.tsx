import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react'; // Need to make sure this is installed or use another icon set
// Checking package.json... @iconify/react is in dependencies.

interface SingleChoiceViewProps {
    options: string[];
    selectedOption?: string;
    onSelect: (option: string) => void;
    disabled?: boolean;
}

export const SingleChoiceView = ({
    options,
    selectedOption,
    onSelect,
    disabled = false
}: SingleChoiceViewProps) => {
    return (
        <div className="space-y-3">
            {options.map((option, index) => {
                const isSelected = selectedOption === option;

                return (
                    <button
                        key={index}
                        onClick={() => !disabled && onSelect(option)}
                        disabled={disabled}
                        className={cn(
                            "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group",
                            isSelected
                                ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(68,237,38,0.1)]"
                                : "border-surface-border bg-surface-dark/50 hover:bg-surface-dark hover:border-gray-600",
                            disabled && "opacity-60 cursor-not-allowed hover:border-surface-border"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <span className={cn(
                                "w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors",
                                isSelected
                                    ? "border-primary bg-primary text-black"
                                    : "border-gray-600 text-gray-400 group-hover:border-gray-500"
                            )}>
                                {String.fromCharCode(65 + index)}
                            </span>
                            <span className={cn(
                                "text-lg",
                                isSelected ? "text-text-main font-semibold" : "text-text-muted group-hover:text-text-main"
                            )}>
                                {option}
                            </span>
                        </div>

                        {isSelected && (
                            <Icon icon="lucide:check-circle" className="w-6 h-6 text-primary animate-in zoom-in spin-in-12 duration-300" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};
