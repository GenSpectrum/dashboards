import { type FC, useMemo, useRef, useState } from 'react';

import { looksNucleotide, useMutationSuggestions } from '../../../pathoplexusExplorer/dataLayer/hooks/suggestions.ts';
import { CATALOG } from '../../../pathoplexusExplorer/domain/catalog.ts';
import type { Place } from '../../../pathoplexusExplorer/domain/geography.ts';
import type { Period } from '../../../pathoplexusExplorer/domain/scope.ts';
import { formatProportion } from '../../../pathoplexusExplorer/domain/statistics.ts';
import type { Subject } from '../../../pathoplexusExplorer/domain/subject.ts';
import { isReadable, termsOf, withoutTerm, withTerm } from '../../../pathoplexusExplorer/domain/terms.ts';
import type { ReferenceSequences } from '../../../pathoplexusExplorer/domain/variant.ts';
import { useClickOutside } from '../ui/useClickOutside.ts';

const LISTED = 10;

type MutationBoxProps = {
    query: string;
    what: Subject | undefined;
    where: Place;
    period: Period;
    sequences: ReferenceSequences | undefined;
    onChange: (query: string) => void;
};

export const MutationBox: FC<MutationBoxProps> = ({ query, what, where, period, sequences, onChange }) => {
    const [draft, setDraft] = useState('');
    const [open, setOpen] = useState(false);
    const input = useRef<HTMLInputElement>(null);
    const container = useRef<HTMLDivElement>(null);
    const terms = useMemo(() => termsOf(query), [query]);

    const suggestions = useMutationSuggestions({
        what,
        where,
        period,
        sequences,
        nucleotides: looksNucleotide(draft),
        catalog: CATALOG,
    });
    const shown = useMemo(() => {
        const wanted = draft.trim().toLowerCase();
        const chosen = new Set(terms);
        return (suggestions.data ?? [])
            .filter((entry) => !chosen.has(entry.value))
            .filter((entry) => wanted === '' || entry.value.toLowerCase().includes(wanted))
            .slice(0, LISTED);
    }, [suggestions.data, draft, terms]);

    useClickOutside(container, open, () => setOpen(false));

    const add = (term: string) => {
        const trimmed = term.trim();
        if (trimmed === '' || !isReadable(trimmed)) {
            return;
        }
        onChange(withTerm(query, trimmed));
        setDraft('');
        input.current?.focus();
    };

    const typed = draft.trim();
    const refused = typed !== '' && !isReadable(typed) && shown.length === 0;

    return (
        <div ref={container} className='relative flex flex-col gap-1'>
            <div
                className={`flex max-w-[26rem] min-w-56 flex-wrap items-center gap-1 border bg-white px-1.5 py-1 ${
                    refused ? 'border-red-400' : 'focus-within:border-primary border-stone-300'
                }`}
            >
                <span className='shrink-0 text-[11px] text-stone-500'>Mutations</span>
                {terms.map((term, index) => (
                    <span
                        key={term}
                        className='border-primary bg-primary/10 flex items-center gap-1 border py-0.5 pr-1 pl-1.5 font-mono text-[12px]'
                    >
                        {term}
                        <button
                            type='button'
                            aria-label={`Remove ${term}`}
                            className='text-primary'
                            onClick={() => onChange(withoutTerm(query, index))}
                        >
                            ×
                        </button>
                    </span>
                ))}
                <input
                    ref={input}
                    value={draft}
                    aria-label='Add a mutation'
                    placeholder={terms.length === 0 ? 'F:S190N, C6244A, 190' : undefined}
                    spellCheck={false}
                    className='min-w-24 flex-1 py-0.5 font-mono text-[13px] outline-none'
                    onChange={(event) => {
                        setDraft(event.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            add(shown.length > 0 && typed !== '' ? shown[0].value : typed);
                        } else if (event.key === 'Backspace' && draft === '' && terms.length > 0) {
                            onChange(withoutTerm(query, terms.length - 1));
                        } else if (event.key === 'Escape') {
                            setOpen(false);
                        }
                    }}
                />
            </div>
            {open && (shown.length > 0 || refused) && (
                <ul className='absolute top-full left-0 z-30 mt-0.5 flex w-72 flex-col border border-stone-300 bg-white shadow-lg'>
                    {refused && (
                        <li className='px-2 py-1.5 text-xs text-red-700'>
                            {typed} does not match the reference genome.
                        </li>
                    )}
                    {shown.map((entry) => (
                        <li key={entry.value}>
                            <button
                                type='button'
                                className='flex w-full items-baseline justify-between gap-2 px-2 py-1 text-left text-sm hover:bg-stone-100'
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => add(entry.value)}
                            >
                                <span className='font-mono'>{entry.value}</span>
                                <span className='shrink-0 text-xs text-stone-500'>
                                    {formatProportion(entry.proportion)}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
