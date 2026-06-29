import { useRef, useState } from 'react';

import { TagChip } from '../TagChip.tsx';

export function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    function addTags(raw: string) {
        const newTags = raw
            .split(/[\s,]+/)
            .map((t) => t.toLowerCase().trim())
            .filter((t) => t && !tags.includes(t));
        if (newTags.length > 0) {
            onChange([...tags, ...newTags]);
        }
        setInputValue('');
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
            e.preventDefault();
            addTags(inputValue);
        } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
            onChange(tags.slice(0, -1));
        }
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.currentTarget.value;
        if (/[\s,]/.test(value)) {
            addTags(value);
        } else {
            setInputValue(value);
        }
    }

    function handleBlur() {
        if (inputValue.trim()) {
            addTags(inputValue);
        }
    }

    function removeTag(tag: string) {
        onChange(tags.filter((t) => t !== tag));
    }

    return (
        <div
            className='input input-bordered flex min-h-10 w-full flex-wrap items-center gap-1 p-1.5'
            onClick={() => inputRef.current?.focus()}
        >
            {tags.map((tag) => (
                <TagChip key={tag} tag={tag} onRemove={removeTag} />
            ))}
            <input
                ref={inputRef}
                type='text'
                className='min-w-20 flex-1 bg-transparent text-sm outline-none'
                placeholder={tags.length === 0 ? 'Add tags (Enter, comma, or space to confirm)' : ''}
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
            />
        </div>
    );
}
