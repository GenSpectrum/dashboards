import { Fragment, type FC, type MouseEvent, type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';

import { useClickOutside } from './useClickOutside.ts';

export type Option = {
    value: string;
    label: string;
    note?: string;
    group?: string;
    depth?: number;
};

const LISTED = 120;

type PickerProps = {
    label: string;
    value: string | undefined;
    /** Provide the selected label even if filtering removed it from the current options. */
    valueLabel?: string;
    placeholder: string;
    options: readonly Option[];
    isLoading?: boolean;
    onSelect: (value: string | undefined) => void;
};

export const Picker: FC<PickerProps> = ({
    label,
    value,
    valueLabel,
    placeholder,
    options,
    isLoading = false,
    onSelect,
}) => {
    const chosen = options.find((option) => option.value === value);
    const shown = value === undefined ? undefined : (chosen?.label ?? valueLabel ?? value);
    const [filter, setFilter] = useState('');
    const matches = useMemo(() => {
        const wanted = filter.trim().toLowerCase();
        const matching =
            wanted === '' ? options : options.filter((option) => option.label.toLowerCase().includes(wanted));
        return { shown: matching.slice(0, LISTED), total: matching.length };
    }, [options, filter]);

    return (
        <Popover
            label={label}
            value={shown ?? (isLoading && options.length === 0 ? 'loading…' : undefined)}
            placeholder={placeholder}
            onClose={() => setFilter('')}
        >
            {(close) => (
                <PickerList
                    label={label}
                    value={value}
                    placeholder={placeholder}
                    filter={filter}
                    matches={matches}
                    onFilter={setFilter}
                    onPick={(next) => {
                        onSelect(next);
                        setFilter('');
                        close();
                    }}
                />
            )}
        </Popover>
    );
};

type PickerListProps = {
    label: string;
    value: string | undefined;
    placeholder: string;
    filter: string;
    matches: { shown: readonly Option[]; total: number };
    onFilter: (filter: string) => void;
    onPick: (value: string | undefined) => void;
};

/** A filter box that controls a list box: the arrow keys move through the options and Enter picks the active one. */
const PickerList: FC<PickerListProps> = ({ label, value, placeholder, filter, matches, onFilter, onPick }) => {
    const listId = useId();
    const optionId = (index: number) => `${listId}-${index}`;
    // Offer clearing the choice first, then the matching options.
    const clearable = value !== undefined;
    const entries: readonly (string | undefined)[] = [
        ...(clearable ? [undefined] : []),
        ...matches.shown.map((option) => option.value),
    ];
    const firstMatch = clearable && matches.shown.length > 0 ? 1 : 0;
    const [active, setActive] = useState(firstMatch);
    useEffect(() => setActive(firstMatch), [filter, firstMatch]);
    const current = entries.length === 0 ? undefined : Math.min(active, entries.length - 1);
    useEffect(() => {
        if (current !== undefined) {
            document.getElementById(optionId(current))?.scrollIntoView({ block: 'nearest' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- the ID is derived from `listId`, which is stable
    }, [current]);

    const optionProps = (index: number, selected: boolean) => ({
        'id': optionId(index),
        'role': 'option',
        // eslint-disable-next-line @typescript-eslint/naming-convention -- ARIA attribute names
        'aria-selected': selected,
        // Keep the focus in the filter box while an option is clicked.
        'onMouseDown': (event: MouseEvent) => event.preventDefault(),
        'onMouseEnter': () => setActive(index),
        'onClick': () => onPick(entries[index]),
    });

    return (
        <>
            <input
                autoFocus
                role='combobox'
                aria-expanded
                aria-autocomplete='list'
                aria-controls={listId}
                aria-activedescendant={current === undefined ? undefined : optionId(current)}
                value={filter}
                placeholder='Filter…'
                aria-label={`Narrow ${label}`}
                className='border-b border-stone-200 px-2 py-1.5 text-sm outline-none'
                onChange={(event) => onFilter(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                        event.preventDefault();
                        const step = event.key === 'ArrowDown' ? 1 : -1;
                        setActive(Math.max(0, Math.min(entries.length - 1, (current ?? 0) + step)));
                    } else if (event.key === 'Enter' && current !== undefined) {
                        event.preventDefault();
                        onPick(entries[current]);
                    }
                }}
            />
            <ul id={listId} role='listbox' aria-label={label} className='max-h-72 overflow-y-auto'>
                {clearable && (
                    <li
                        {...optionProps(0, false)}
                        className={`w-full cursor-pointer px-2 py-1 text-left text-xs text-stone-500 ${
                            current === 0 ? 'bg-stone-100' : ''
                        }`}
                    >
                        {placeholder}
                    </li>
                )}
                {matches.shown.map((option, position) => {
                    const index = position + (clearable ? 1 : 0);
                    const heading =
                        option.group !== undefined &&
                        (position === 0 || matches.shown[position - 1].group !== option.group);
                    return (
                        <Fragment key={option.value}>
                            {heading && (
                                <li
                                    role='presentation'
                                    className='bg-stone-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-stone-500 uppercase'
                                >
                                    {option.group}
                                </li>
                            )}
                            <li
                                {...optionProps(index, option.value === value)}
                                className={`flex w-full cursor-pointer items-baseline justify-between gap-2 px-2 py-1 text-left text-sm ${
                                    option.value === value ? 'font-semibold' : ''
                                } ${current === index ? 'bg-stone-100' : ''}`}
                                style={{ paddingLeft: `${0.5 + (option.depth ?? 0)}rem` }}
                            >
                                <span className='min-w-0 flex-1 truncate'>{option.label}</span>
                                {option.note !== undefined && (
                                    <span className='shrink-0 text-xs text-stone-500'>{option.note}</span>
                                )}
                            </li>
                        </Fragment>
                    );
                })}
            </ul>
            {matches.shown.length === 0 && <div className='px-2 py-2 text-xs text-stone-500'>No match.</div>}
            {matches.total > matches.shown.length && (
                <div className='border-t border-stone-200 px-2 py-1 text-[11px] text-stone-500'>
                    {matches.shown.length} of {matches.total} shown
                </div>
            )}
        </>
    );
};

type PopoverProps = {
    label: string;
    value: string | undefined;
    placeholder: string;
    width?: string;
    onClose?: () => void;
    children: (close: () => void) => ReactNode;
};

export const Popover: FC<PopoverProps> = ({ label, value, placeholder, width = 'w-72', onClose, children }) => {
    const [open, setOpen] = useState(false);
    const container = useRef<HTMLDivElement>(null);
    const button = useRef<HTMLButtonElement>(null);
    const buttonId = useId();
    // Keep the callback current without reinstalling the listener.
    const closed = useRef(onClose);
    closed.current = onClose;

    useClickOutside(container, open, () => {
        setOpen(false);
        closed.current?.();
    });

    useEffect(() => {
        if (!open) {
            return;
        }
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
                closed.current?.();
                button.current?.focus();
            }
        };
        document.addEventListener('keydown', escape);
        return () => document.removeEventListener('keydown', escape);
    }, [open]);

    return (
        <div ref={container} className='relative'>
            <button
                ref={button}
                id={buttonId}
                type='button'
                aria-haspopup='dialog'
                aria-expanded={open}
                className='flex max-w-64 items-baseline gap-1.5 border border-stone-300 bg-white py-1 pr-1.5 pl-2 text-left text-[13px] hover:border-stone-500'
                onClick={() => setOpen(!open)}
            >
                <span className='shrink-0 text-[11px] text-stone-500'>{label}</span>
                <span className={`min-w-0 flex-1 truncate ${value === undefined ? 'text-stone-400' : 'font-medium'}`}>
                    {value ?? placeholder}
                </span>
                <span aria-hidden className='shrink-0 text-[11px] text-stone-400'>
                    ▾
                </span>
            </button>
            {open && (
                <div
                    role='dialog'
                    aria-labelledby={buttonId}
                    className={`absolute top-full left-0 z-30 mt-0.5 flex ${width} flex-col border border-stone-300 bg-white shadow-lg`}
                >
                    {children(() => {
                        setOpen(false);
                        onClose?.();
                        // Hand the focus back to the trigger, since the control that had it is gone.
                        button.current?.focus();
                    })}
                </div>
            )}
        </div>
    );
};
