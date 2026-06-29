import { useQuery } from '@tanstack/react-query';
import { useCombobox } from 'downshift';
import { useMemo, useRef, useState } from 'react';

import { getBackendServiceForClientside } from '../../../backendApi/backendService.ts';
import { TagChip } from '../TagChip.tsx';

export function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
    const { data: allTags = [] } = useQuery({
        queryKey: ['collection-tags'],
        queryFn: async () => {
            const result = await getBackendServiceForClientside().getCollectionTags();
            return result.tags;
        },
    });

    const [inputValue, setInputValue] = useState('');

    const addTags = (raw: string) => {
        const newTags = raw
            .split(/[\s,]+/)
            .map((t) => t.toLowerCase().trim())
            .filter((t) => t && !tags.includes(t));
        if (newTags.length > 0) {
            onChange([...tags, ...newTags]);
        }
        setInputValue('');
    };

    const addTag = (raw: string) => addTags(raw);

    const removeTag = (tag: string) => {
        onChange(tags.filter((t) => t !== tag));
    };

    const filteredSuggestions = useMemo(
        () =>
            allTags.filter(
                (t) => !tags.includes(t) && (inputValue === '' || t.toLowerCase().includes(inputValue.toLowerCase())),
            ),
        [allTags, tags, inputValue],
    );

    const { isOpen, getMenuProps, getInputProps, getItemProps, highlightedIndex, closeMenu } = useCombobox({
        items: filteredSuggestions,
        itemToString: (item) => item ?? '',
        inputValue,
        onStateChange({ type, selectedItem: newSelectedItem }) {
            switch (type) {
                case useCombobox.stateChangeTypes.InputKeyDownEnter:
                case useCombobox.stateChangeTypes.ItemClick:
                    if (newSelectedItem) {
                        addTag(newSelectedItem);
                    }
                    setInputValue('');
                    break;
                default:
                    break;
            }
        },
        stateReducer(_state, { changes, type }) {
            switch (type) {
                case useCombobox.stateChangeTypes.InputKeyDownEnter:
                case useCombobox.stateChangeTypes.ItemClick:
                    return { ...changes, isOpen: true, inputValue: '' };
                default:
                    return changes;
            }
        },
    });

    const inputRef = useRef<HTMLInputElement>(null);
    const {
        onKeyDown: downshiftKeyDown,
        onChange: downshiftOnChange,
        ...restInputProps
    } = getInputProps({
        ref: inputRef,
    });

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ',' || e.key === ' ') {
            e.preventDefault();
            if (inputValue.trim()) {
                addTag(inputValue);
            }
        } else if (e.key === 'Enter' && highlightedIndex < 0) {
            e.preventDefault();
            if (inputValue.trim()) {
                addTag(inputValue);
            }
        } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        } else {
            downshiftKeyDown?.(e);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.currentTarget.value;
        if (/[\s,]/.test(value)) {
            addTags(value);
            closeMenu();
        } else {
            setInputValue(value);
            downshiftOnChange?.(e);
        }
    };

    const handleBlur = () => {
        if (inputValue.trim()) {
            addTag(inputValue);
        }
    };

    return (
        <div className='relative w-full'>
            <div
                className='input input-bordered flex h-auto min-h-10 w-full flex-wrap items-center gap-1 p-1.5'
                onClick={() => inputRef.current?.focus()}
            >
                {tags.map((tag) => (
                    <TagChip key={tag} tag={tag} onRemove={removeTag} />
                ))}
                <input
                    className='min-w-20 flex-1 bg-transparent text-sm outline-none'
                    placeholder={tags.length === 0 ? 'Add tags (Enter, comma, or space to confirm)' : ''}
                    {...restInputProps}
                    onKeyDown={handleKeyDown}
                    onChange={handleChange}
                    onBlur={handleBlur}
                />
            </div>
            <ul
                {...getMenuProps()}
                onMouseDown={(e) => e.preventDefault()}
                className={`bg-base-100 border-base-300 absolute z-10 mt-1 max-h-60 w-full overflow-y-auto border shadow-md ${isOpen && filteredSuggestions.length > 0 ? '' : 'hidden'}`}
            >
                {filteredSuggestions.map((item, index) => (
                    <li
                        key={item}
                        className={`cursor-pointer px-3 py-2 text-sm ${highlightedIndex === index ? 'bg-base-200' : ''}`}
                        {...getItemProps({ item, index })}
                    >
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}
