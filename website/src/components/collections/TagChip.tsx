export function TagChip({ tag, onRemove }: { tag: string; onRemove?: (tag: string) => void }) {
    return (
        <span className='border-l-primary flex items-center gap-1 rounded border border-l-4 border-gray-300 bg-gray-100 px-2 py-0.5 text-xs text-gray-700'>
            {tag}
            {onRemove !== undefined && (
                <button
                    type='button'
                    aria-label={`Remove tag ${tag}`}
                    className='hover:text-gray-500'
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(tag);
                    }}
                >
                    ×
                </button>
            )}
        </span>
    );
}
