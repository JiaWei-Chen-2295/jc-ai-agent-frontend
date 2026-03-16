import type { ReactNode } from 'react';
import { NeonCard } from './NeonCard';

interface QuestionCardProps {
    questionText: string;
    imageUrl?: string;
    children: ReactNode;
    tags?: string[];
    current?: number;
    total?: number;
}

export const QuestionCard = ({
    questionText,
    imageUrl,
    children,
    tags = [],
    current,
    total
}: QuestionCardProps) => {
    return (
        <div className="w-full max-w-4xl mx-auto anime-fly-in">
            {/* Progress Header */}
            {(current !== undefined && total !== undefined) && (
                <div className="mb-4 flex items-center justify-between text-text-muted text-sm font-display">
                    <span>QUESTION {current} / {total}</span>
                    <div className="flex gap-2">
                        {tags.map((tag, i) => (
                            <span key={i} className="px-2 py-1 rounded bg-surface-dark border border-surface-border text-xs">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <NeonCard className="mb-6 border-t-4 border-t-primary">
                <h1 className="text-xl md:text-2xl font-bold text-text-main mb-6 leading-relaxed">
                    {questionText}
                </h1>

                {imageUrl && (
                    <div className="mb-6 rounded-lg overflow-hidden border border-surface-border bg-black/50">
                        <img
                            src={imageUrl}
                            alt="Question Reference"
                            className="max-h-[400px] w-full object-contain mx-auto"
                        />
                    </div>
                )}

                <div className="mt-8">
                    {children}
                </div>
            </NeonCard>
        </div>
    );
};
