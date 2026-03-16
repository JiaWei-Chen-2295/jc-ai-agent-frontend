import { cn } from '@/lib/utils';
import { useState } from 'react';

// Simple code editor using textarea to avoid heavy dependencies like monaco for now.
// Ideal future upgrade: react-simple-code-editor or monaco-editor-react

interface CodeCompletionViewProps {
    initialCode?: string; // Code with hole?
    onAnswer: (code: string) => void;
    language?: string;
    disabled?: boolean;
}

export const CodeCompletionView = ({
    initialCode = "",
    onAnswer,
    language = "java",
    disabled = false
}: CodeCompletionViewProps) => {
    const [code, setCode] = useState(initialCode);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setCode(val);
        onAnswer(val);
    };

    return (
        <div className="border border-surface-border rounded-xl overflow-hidden bg-[#1e1e1e]">
            <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#333]">
                <span className="text-xs text-text-muted uppercase font-mono">{language}</span>
                {disabled && <span className="text-xs text-yellow-500">Read Only</span>}
            </div>
            <textarea
                value={code}
                onChange={handleChange}
                disabled={disabled}
                spellCheck={false}
                className={cn(
                    "w-full h-64 p-4 font-mono text-sm leading-relaxed bg-transparent text-[#d4d4d4] focus:outline-none resize-y",
                    "selection:bg-[#264f78]",
                    disabled && "opacity-60 cursor-not-allowed"
                )}
                style={{ tabSize: 4 }}
            />
        </div>
    );
};
