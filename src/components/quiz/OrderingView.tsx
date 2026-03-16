import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

// Sortable Item Component
function SortableItem({ id, content, disabled }: { id: string, content: string, disabled?: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} className="relative mb-3 touch-none">
            <div
                className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border border-surface-border bg-surface-dark/50 transition-colors",
                    isDragging ? "border-primary shadow-glow opacity-90" : "hover:border-gray-600",
                    disabled && "opacity-60"
                )}
            >
                <button
                    {...attributes}
                    {...listeners}
                    className={cn(
                        "p-2 rounded hover:bg-white/5 cursor-grab active:cursor-grabbing text-text-muted",
                        disabled && "cursor-not-allowed"
                    )}
                    disabled={disabled}
                >
                    <Icon icon="lucide:grip-vertical" className="w-5 h-5" />
                </button>
                <span className="text-lg text-text-main font-medium select-none">{content}</span>
            </div>
        </div>
    );
}

interface OrderingViewProps {
    options: string[]; // Initial random order
    onOrderChange: (orderedOptions: string[]) => void;
    disabled?: boolean;
}

export const OrderingView = ({
    options,
    onOrderChange,
    disabled = false
}: OrderingViewProps) => {
    // We need to maintain local state for the drag operations
    const [items, setItems] = useState(options);

    // Sync if options change externally (new question)
    useEffect(() => {
        setItems(options);
    }, [options]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setItems((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over?.id as string);

                const newOrder = arrayMove(items, oldIndex, newIndex);
                onOrderChange(newOrder); // Notify parent
                return newOrder;
            });
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <div className="space-y-2">
                <div className="text-sm text-text-muted mb-2 font-display">
                    拖动项目进行排序
                </div>
                <SortableContext
                    items={items}
                    strategy={verticalListSortingStrategy}
                >
                    {items.map((option) => (
                        <SortableItem key={option} id={option} content={option} disabled={disabled} />
                    ))}
                </SortableContext>
            </div>
        </DndContext>
    );
};
