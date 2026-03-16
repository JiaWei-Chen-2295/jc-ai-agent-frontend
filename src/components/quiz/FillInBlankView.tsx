import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils'; // Not strictly needed here but good practice

interface FillInBlankViewProps {
    text: string; // "The capital of France is [Paris] and Germany is [Berlin]"
    onAnswer: (answers: string[]) => void;
    disabled?: boolean;
}

export const FillInBlankView = ({
    text,
    onAnswer,
    disabled = false
}: FillInBlankViewProps) => {
    // Parse text to find chunks and blanks
    // Assumption: Blanks are represented by some marker, e.g., "____" or special syntax in the passed text
    // BUT, usually the raw question text comes from backend with placeholders or we need to strip answers.
    // Requirement says: "In text embedded input box".
    // Let's assume the text contains placeholders like `{{BLANK}}` or `____`.

    // Real implementation strategy: Split string by placeholder.

    const [parts, setParts] = useState<string[]>([]);
    const [values, setValues] = useState<string[]>([]);

    useEffect(() => {
        // Regex to split by `____` or `{{BLANK}}`
        // Let's assume standard `____` for now as per widespread quiz formats
        const splitParts = text.split(/_{3,}|{{BLANK}}/);
        setParts(splitParts);
        setValues(new Array(splitParts.length - 1).fill(''));
    }, [text]);

    const handleChange = (index: number, val: string) => {
        const newValues = [...values];
        newValues[index] = val;
        setValues(newValues);
        onAnswer(newValues);
    };

    return (
        <div className="leading-loose text-lg md:text-xl text-text-main font-medium">
            {parts.map((part, index) => (
                <React.Fragment key={index}>
                    <span>{part}</span>
                    {index < parts.length - 1 && (
                        <input
                            type="text"
                            disabled={disabled}
                            value={values[index]}
                            onChange={(e) => handleChange(index, e.target.value)}
                            className={cn(
                                "mx-2 bg-transparent border-b-2 text-center min-w-[100px] w-auto transition-colors outline-none",
                                "focus:border-primary focus:bg-primary/5",
                                disabled ? "border-gray-700 text-gray-400" : "border-gray-500 text-primary"
                            )}
                            style={{ width: Math.max(100, (values[index]?.length || 0) * 12) + 'px' }}
                            placeholder="?"
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
