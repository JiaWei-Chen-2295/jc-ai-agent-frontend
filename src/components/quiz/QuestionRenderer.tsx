import { useQuizStore } from '@/store/quizStore';
import type { QuestionVO } from '@/api/models/QuestionVO';
import { QuestionCard } from './QuestionCard';
import { SingleChoiceView } from './SingleChoiceView';
import { MultipleSelectView } from './MultipleSelectView';
import { TrueFalseView } from './TrueFalseView';
import { OrderingView } from './OrderingView';
import { MatchingView } from './MatchingView';
import { FillInBlankView } from './FillInBlankView';
import { ShortAnswerView } from './ShortAnswerView';
import { CodeCompletionView } from './CodeCompletionView';

interface QuestionRendererProps {
    question: QuestionVO;
}

export const QuestionRenderer = ({ question }: QuestionRendererProps) => {
    const { answers, setAnswer, questions } = useQuizStore();

    // ID should exist, but handle safety
    if (!question.id) return null;

    // Safe access to current answer
    const currentAnswer = answers[question.id];

    // Calculate index for display
    const currentQuestionIndex = questions.findIndex(q => q.id === question.id);

    const handleAnswer = (val: any) => {
        if (question.id) {
            setAnswer(question.id, val);
        }
    };

    const renderContent = () => {
        switch (question.questionType) {
            case 'SINGLE_CHOICE':
                return (
                    <SingleChoiceView
                        options={question.options || []}
                        selectedOption={currentAnswer}
                        onSelect={handleAnswer}
                    />
                );
            case 'MULTIPLE_SELECT':
                return (
                    <MultipleSelectView
                        options={question.options || []}
                        selectedOptions={currentAnswer || []}
                        onSelect={handleAnswer}
                    />
                );
            case 'TRUE_FALSE':
                return (
                    <TrueFalseView
                        selectedOption={currentAnswer}
                        onSelect={handleAnswer}
                    />
                );
            case 'ORDERING':
                return (
                    <OrderingView
                        options={currentAnswer || question.options || []}
                        onOrderChange={handleAnswer}
                    />
                );
            case 'MATCHING':
                // Assuming options contains concepts. Real backend might need structured data.
                return (
                    <MatchingView
                        concepts={question.options || []}
                        definitions={(question as any).definitions || []}
                        pairs={currentAnswer || {}}
                        onMatch={handleAnswer}
                    />
                );
            case 'FILL_IN_BLANK':
                return (
                    <FillInBlankView
                        text={question.questionText || ""}
                        onAnswer={handleAnswer}
                    />
                );
            case 'SHORT_ANSWER':
            case 'EXPLANATION':
                return (
                    <ShortAnswerView
                        onAnswer={handleAnswer}
                    />
                );
            case 'CODE_COMPLETION':
                return (
                    <CodeCompletionView
                        initialCode={(question as any).codeSnippet || ""}
                        onAnswer={handleAnswer}
                    />
                );
            default:
                return <div>Unsupported question type: {question.questionType}</div>;
        }
    };

    return (
        <QuestionCard
            questionText={question.questionType === 'FILL_IN_BLANK' ? "Fill in the blanks below:" : (question.questionText || "")}
            imageUrl={(question as any).imageUrl} // Not in VO yet, assume extra or absent
            current={currentQuestionIndex + 1}
            total={questions.length}
            tags={question.relatedConcept ? [question.relatedConcept, question.difficulty || 'MEDIUM'] : []}
        >
            {renderContent()}
        </QuestionCard>
    );
};
