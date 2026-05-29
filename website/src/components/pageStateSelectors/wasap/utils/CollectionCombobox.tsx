import { useCombobox } from 'downshift';
import { useMemo, useRef, useState } from 'react';

import { type CollectionSummary } from '../../../../types/Collection';

export function CollectionCombobox({
    collections,
    value,
    onChange,
    placeholderText = 'Select variant',
}: {
    collections: CollectionSummary[];
    value: CollectionSummary | null;
    onChange: (item: CollectionSummary | null) => void;
    placeholderText?: string;
}) {
    const [inputFilter, setInputFilter] = useState(() => value?.name ?? '');
    const [inputIsInvalid, setInputIsInvalid] = useState(false);

    const filteredCollections = useMemo(
        () =>
            collections
                .filter((c) => c.name.toLowerCase().includes(inputFilter.toLowerCase()))
                .sort((a, b) => a.name.localeCompare(b.name)),
        [collections, inputFilter],
    );

    const buttonRef = useRef<HTMLButtonElement>(null);

    const { isOpen, getToggleButtonProps, getMenuProps, getInputProps, highlightedIndex, getItemProps, inputValue, closeMenu, reset } =
        useCombobox({
            items: filteredCollections,
            itemToString: (item) => item?.name ?? '',
            selectedItem: value,
            onInputValueChange({ inputValue }) {
                setInputIsInvalid(false);
                setInputFilter(inputValue.trim());
            },
            onSelectedItemChange({ selectedItem }) {
                onChange(selectedItem ?? null);
            },
        });

    const onInputBlur = () => {
        if (inputValue === '') {
            onChange(null);
            return;
        }
        const match = collections.find((c) => c.name === inputValue.trim());
        if (match !== undefined) {
            onChange(match);
            return;
        }
        setInputIsInvalid(true);
    };

    return (
        <div className='relative w-full'>
            <div
                className={`flex gap-0.5 input w-full ${inputIsInvalid ? 'input-error' : 'input-bordered'}`}
                onBlur={(e) => {
                    if (e.relatedTarget !== buttonRef.current) {
                        closeMenu();
                    }
                }}
            >
                <input placeholder={placeholderText} className='w-full p-1.5' {...getInputProps()} onBlur={onInputBlur} />
                {inputValue !== '' && (
                    <button
                        aria-label='clear selection'
                        className='px-2'
                        type='button'
                        tabIndex={-1}
                        onClick={() => { reset(); onChange(null); }}
                    >
                        ×
                    </button>
                )}
                <button aria-label='toggle menu' className='px-2' type='button' {...getToggleButtonProps()} ref={buttonRef}>
                    {isOpen ? <>↑</> : <>↓</>}
                </button>
            </div>
            <ul
                className={`absolute bg-base-100 border border-base-300 mt-1 shadow-md max-h-80 overflow-y-auto z-10 w-full ${isOpen ? '' : 'hidden'}`}
                {...getMenuProps()}
            >
                {filteredCollections.length > 0 ? (
                    filteredCollections.map((item, index) => (
                        <li
                            key={item.id}
                            className={`py-2 px-3 cursor-pointer ${highlightedIndex === index ? 'bg-base-200' : ''} ${value?.id === item.id ? 'font-bold' : ''}`}
                            {...getItemProps({ item, index })}
                        >
                            {item.name}
                        </li>
                    ))
                ) : (
                    <li className='py-2 px-3 text-sm text-base-content/60'>No variants found.</li>
                )}
            </ul>
        </div>
    );
}
