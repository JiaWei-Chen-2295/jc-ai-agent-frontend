import { useState } from 'react';
import { cn } from '@/lib/utils';
// Removed unused/unnecessary imports

interface MatchingViewProps {
    concepts: string[]; // Left side
    definitions: string[]; // Right side
    pairs?: Record<string, string>; // concept -> definition
    onMatch: (pairs: Record<string, string>) => void;
    disabled?: boolean;
}

export const MatchingView = ({
    concepts,
    definitions,
    pairs = {},
    onMatch,
    disabled = false
}: MatchingViewProps) => {
    const [selectedConcept, setSelectedConcept] = useState<string | null>(null);

    const handleConceptClick = (concept: string) => {
        if (disabled) return;
        if (pairs[concept]) {
            // Unmatch if already matched
            const newPairs = { ...pairs };
            delete newPairs[concept];
            onMatch(newPairs);
        } else {
            setSelectedConcept(concept);
        }
    };

    const handleDefinitionClick = (def: string) => {
        if (disabled || !selectedConcept) return;

        // Check if definition is already used
        const isDefUsed = Object.values(pairs).includes(def);
        if (isDefUsed) return; // Or maybe allow override?

        const newPairs = { ...pairs, [selectedConcept]: def };
        onMatch(newPairs);
        setSelectedConcept(null);
    };

    const getPairColor = (index: number) => {
        const colors = [
            'border-green-400 text-green-400',
            'border-blue-400 text-blue-400',
            'border-yellow-400 text-yellow-400',
            'border-purple-400 text-purple-400',
            'border-pink-400 text-pink-400',
        ];
        return colors[index % colors.length];
    };

    // Helper to find which pair index a concept belongs to, to color code match
    const getPairIndex = (concept: string) => {
        return Object.keys(pairs).indexOf(concept);
    };

    return (
        <div className="grid grid-cols-2 gap-8 md:gap-16 relative">
            {/* Left Column: Concepts */}
            <div className="space-y-4">
                <h3 className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2">概念</h3>
                {concepts.map((concept) => {
                    const isMatched = !!pairs[concept];
                    const isSelected = selectedConcept === concept;
                    const pairIdx = getPairIndex(concept);

                    return (
                        <button
                            key={concept}
                            onClick={() => handleConceptClick(concept)}
                            disabled={disabled}
                            className={cn(
                                "w-full p-4 rounded-xl border-2 text-left transition-all relative",
                                isSelected ? "border-primary bg-primary/10" : "bg-surface-dark/50 hover:bg-surface-dark",
                                !isSelected && !isMatched ? "border-surface-border" : "",
                                isMatched ? getPairColor(pairIdx) : "text-text-main",
                                disabled && "opacity-60 cursor-not-allowed"
                            )}
                        >
                            {concept}
                            {isMatched && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface-dark flex items-center justify-center border border-current text-xs">
                                    {pairIdx + 1}
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Right Column: Definitions */}
            <div className="space-y-4">
                <h3 className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2">定义</h3>
                {definitions.map((def) => {
                    // Find which concept pairs to this definition
                    const pairedConcept = Object.keys(pairs).find(key => pairs[key] === def);
                    const isMatched = !!pairedConcept;
                    const pairIdx = pairedConcept ? getPairIndex(pairedConcept) : -1;

                    return (
                        <button
                            key={def}
                            onClick={() => handleDefinitionClick(def)}
                            disabled={disabled}
                            className={cn(
                                "w-full p-4 rounded-xl border-2 text-left transition-all relative",
                                isMatched ? getPairColor(pairIdx) : "border-surface-border bg-surface-dark/50 hover:bg-surface-dark text-text-main",
                                selectedConcept && !isMatched && !disabled ? "animate-pulse border-dashed border-primary/30" : "", // Hint valid targets
                                disabled && "opacity-60 cursor-not-allowed"
                            )}
                        >
                            {isMatched && (
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface-dark flex items-center justify-center border border-current text-xs">
                                    {pairIdx + 1}
                                </div>
                            )}
                            <span className={isMatched ? "pl-8" : ""}>{def}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    );
};
