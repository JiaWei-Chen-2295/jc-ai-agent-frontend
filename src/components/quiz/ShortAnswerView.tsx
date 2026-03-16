import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ShortAnswerViewProps {
    onAnswer: (text: string) => void;
    placeholder?: string;
    maxLength?: number;
    disabled?: boolean;
}

export const ShortAnswerView = ({
    onAnswer,
    placeholder = "Type your answer here...",
    maxLength = 1000,
    disabled = false
}: ShortAnswerViewProps) => {
    const [value, setValue] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setValue(val);
        onAnswer(val);
    };

    return (
        <div className="relative">
            <textarea
                disabled={disabled}
                value={value}
                onChange={handleChange}
                maxLength={maxLength}
                placeholder={placeholder}
                className={cn(
                    "w-full h-40 bg-background-input border border-surface-border rounded-xl p-4 text-text-main text-lg resize-none focus:outline-none focus:border-primary transition-colors",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            />
            <div className="absolute bottom-4 right-4 text-text-muted text-xs">
                {value.length} / {maxLength}
            </div>
        </div>
    );
};
