import { useState, useEffect } from 'react';
import { useQuizStore } from '@/store/quizStore';
import { Service } from '@/api/services/Service';
import type { StudyFriendDocument } from '@/api/models/StudyFriendDocument';
import { NeonButton } from './NeonButton';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

export const QuizSetup = () => {
    const { startNewSession, sessionStatus } = useQuizStore();
    const [documents, setDocuments] = useState<StudyFriendDocument[]>([]);
    const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDocs = async () => {
            setIsLoadingDocs(true);
            try {
                const response = await Service.listDocuments();
                // Handle potential response wrapper
                const docs = Array.isArray(response) ? response : (response as any).data || [];
                if (Array.isArray(docs)) {
                    setDocuments(docs);
                } else {
                    console.error("Unexpected documents response format:", response);
                    setDocuments([]);
                    setError("Received invalid data format from server.");
                }
            } catch (err) {
                console.error("Failed to load documents", err);
                setError("Failed to load documents. Please try again.");
            } finally {
                setIsLoadingDocs(false);
            }
        };
        fetchDocs();
    }, []);

    const toggleDoc = (id: number) => {
        setSelectedDocs(prev =>
            prev.includes(id)
                ? prev.filter(d => d !== id)
                : [...prev, id]
        );
    };

    const handleStart = async () => {
        console.log('[QuizSetup] handleStart clicked, selectedDocs:', selectedDocs);
        if (selectedDocs.length === 0) {
            console.log('[QuizSetup] No docs selected, returning');
            return;
        }
        console.log('[QuizSetup] Calling startNewSession...');
        await startNewSession(selectedDocs);
        console.log('[QuizSetup] startNewSession completed');
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-display font-bold text-white tracking-tight drop-shadow-neon">
                    开始新的测验
                </h2>
                <p className="text-text-muted">
                    选择文档后，系统将基于 AI 自适应生成题目，持续测试直到完全掌握知识点
                </p>
            </div>

            <div className="bg-surface-card/40 backdrop-blur-md border border-surface-border/50 rounded-2xl p-6 shadow-card-hover">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Icon icon="lucide:file-text" className="text-primary" />
                    可用文档
                </h3>

                {isLoadingDocs ? (
                    <div className="flex justify-center p-8">
                        <Icon icon="svg-spinners:3-dots-fade" width={32} className="text-primary" />
                    </div>
                ) : error ? (
                    <div className="text-red-400 text-center p-4 bg-red-500/10 rounded-lg">
                        {error}
                    </div>
                ) : documents.length === 0 ? (
                    <div className="text-center p-8 text-text-muted border-2 border-dashed border-surface-border rounded-xl">
                        暂无文档，请先上传文档
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {documents.map(doc => (
                            <div
                                key={doc.id}
                                onClick={() => doc.id !== undefined && toggleDoc(doc.id)}
                                className={cn(
                                    "p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between group",
                                    selectedDocs.includes(doc.id!)
                                        ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(68,237,38,0.15)]"
                                        : "bg-surface-hover/30 border-transparent hover:border-surface-border hover:bg-surface-hover/50"
                                )}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={cn(
                                        "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                        selectedDocs.includes(doc.id!)
                                            ? "bg-primary border-primary text-background-dark"
                                            : "border-text-muted/50 group-hover:border-primary/50"
                                    )}>
                                        {selectedDocs.includes(doc.id!) && <Icon icon="lucide:check" width={14} />}
                                    </div>
                                    <div className="truncate">
                                        <div className="text-sm font-medium text-white truncate">{doc.fileName}</div>
                                        <div className="text-xs text-text-muted mt-0.5">
                                            {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Unknown Date'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-4">
                <NeonButton
                    onClick={handleStart}
                    disabled={selectedDocs.length === 0 || sessionStatus === 'LOADING'}
                    className="w-full md:w-auto min-w-[160px]"
                >
                    {sessionStatus === 'LOADING' ? (
                        <span className="flex items-center gap-2">
                            <Icon icon="svg-spinners:ring-resize" /> 启动中...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            开始测验 <Icon icon="lucide:arrow-right" />
                        </span>
                    )}
                </NeonButton>
            </div>
        </div>
    );
}
