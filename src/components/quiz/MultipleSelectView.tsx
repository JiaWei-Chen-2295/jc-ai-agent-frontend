import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';

interface MultipleSelectViewProps {
    options: string[];
    selectedOptions?: string[]; // Array of selected values
    onSelect: (options: string[]) => void;
    disabled?: boolean;
}

export const MultipleSelectView = ({
    options,
    selectedOptions = [],
    onSelect,
    disabled = false
}: MultipleSelectViewProps) => {

    const toggleOption = (option: string) => {
        if (disabled) return;

        if (selectedOptions.includes(option)) {
            onSelect(selectedOptions.filter(o => o !== option));
        } else {
            onSelect([...selectedOptions, option]);
        }
    };

    return (
        <div className="space-y-3">
            <div className="text-sm text-text-muted mb-2 font-display">
                选择所有适用选项（多选）
            </div>
            {options.map((option, index) => {
                const isSelected = selectedOptions.includes(option);

                return (
                    <button
                        key={index}
                        onClick={() => toggleOption(option)}
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
                            <div className={cn(
                                "w-6 h-6 rounded border-2 flex items-center justify-center transition-colors",
                                isSelected
                                    ? "border-primary bg-primary text-black"
                                    : "border-gray-600 bg-transparent group-hover:border-gray-500"
                            )}>
                                {isSelected && <Icon icon="lucide:check" className="w-4 h-4" />}
                            </div>
                            <span className={cn(
                                "text-lg",
                                isSelected ? "text-text-main font-semibold" : "text-text-muted group-hover:text-text-main"
                            )}>
                                {option}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
