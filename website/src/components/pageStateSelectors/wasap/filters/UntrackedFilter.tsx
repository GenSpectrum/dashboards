import { type UseQueryResult } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { Loading } from '../../../../util/Loading';
import {
    type ExcludeSetName,
    type WasapUntrackedFilter,
} from '../../../../views/pageStateHandlers/WasapPageStateHandler';
import { KnownVariantsExclusionInfo } from '../InfoBlocks';
import { LabeledField } from '../utils/LabeledField';
import { SequenceTypeSelector } from '../utils/SequenceTypeSelector';

function parseVariantsFromText(text: string): string[] {
    return text
        .trim()
        .split(/[\s,]+/)
        .filter((v) => v.length > 0);
}

export function UntrackedFilter({
    pageState,
    setPageState,
    cladeLineageQueryResult: { isPending, isError, data: cladeLineages },
}: {
    pageState: WasapUntrackedFilter;
    setPageState: (newState: WasapUntrackedFilter) => void;
    cladeLineageQueryResult: UseQueryResult<Record<string, string>>;
}) {
    const defaultLineages = cladeLineages ? Object.values(cladeLineages) : [];
    defaultLineages.sort();

    // Local state for the textarea to preserve formatting (spaces, etc.)
    const [customVariantsText, setCustomVariantsText] = useState(pageState.excludeVariants?.join(' ') ?? '');

    // Sync local state when excludeVariants changes externally (not from our own typing)
    useEffect(() => {
        const variantsFromText = parseVariantsFromText(customVariantsText);
        const currentVariants = pageState.excludeVariants ?? [];

        // Only update text if the arrays are different (external change)
        const arraysEqual =
            variantsFromText.length === currentVariants.length &&
            variantsFromText.every((v, i) => v === currentVariants[i]);

        if (!arraysEqual) {
            setCustomVariantsText(currentVariants.join(' '));
        }
        // we don't include the 'customVariantsText' in the dependencies,
        // because we only want to run when the variants change, not on every keystroke.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageState.excludeVariants]);

    return (
        <>
            <SequenceTypeSelector
                value={pageState.sequenceType}
                onChange={(sequenceType) => setPageState({ ...pageState, sequenceType })}
            />
            <LabeledField label='Known variants to exclude' info={<KnownVariantsExclusionInfo />}>
                <select
                    className='select select-bordered'
                    value={pageState.excludeSet}
                    onChange={(e) => setPageState({ ...pageState, excludeSet: e.target.value as ExcludeSetName })}
                >
                    <option value='nextstrain'>Nextstrain clades</option>
                    <option value='custom'>custom</option>
                </select>
            </LabeledField>
            {pageState.excludeSet === 'nextstrain' ? (
                isPending ? (
                    <Loading />
                ) : isError ? (
                    <span>Failed to load variant list. Please try again or use custom variant list.</span>
                ) : (
                    <div className='px-1 py-2 text-sm'>
                        {defaultLineages.join(', ')}{' '}
                        <button
                            className='cursor-pointer underline'
                            onClick={() => {
                                const variantsText = defaultLineages.join(' ');
                                setCustomVariantsText(variantsText);
                                setPageState({
                                    ...pageState,
                                    excludeSet: 'custom',
                                    excludeVariants: defaultLineages,
                                });
                            }}
                        >
                            Customize ...
                        </button>
                    </div>
                )
            ) : (
                <>
                    <div className='h-2' />
                    <LabeledField label='Custom variant list'>
                        <textarea
                            className='input input-bordered h-24 resize-y overflow-auto p-1 whitespace-pre-wrap'
                            wrap='soft'
                            placeholder='JN.1* KP.2* XFG* ...'
                            value={customVariantsText}
                            onChange={(e) => {
                                const newText = e.target.value;
                                setCustomVariantsText(newText);

                                const newVariants = parseVariantsFromText(newText);

                                setPageState({
                                    ...pageState,
                                    excludeVariants: newVariants,
                                });
                            }}
                        />
                    </LabeledField>
                </>
            )}
        </>
    );
}
