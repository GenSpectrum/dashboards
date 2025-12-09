import { type UseQueryResult } from '@tanstack/react-query';

import { Loading } from '../../../../util/Loading';
import { GsLineageFilter } from '../../../genspectrum/GsLineageFilter';
import type { ExcludeSetName, WasapUntrackedFilter } from '../../../views/wasap/wasapPageConfig';
import { KnownVariantsExclusionInfo } from '../InfoBlocks';
import { LabeledField } from '../utils/LabeledField';
import { SequenceTypeSelector } from '../utils/SequenceTypeSelector';

interface UntrackedFilterProps {
    pageState: WasapUntrackedFilter;
    setPageState: (newState: WasapUntrackedFilter) => void;
    cladeLineageQueryResult: UseQueryResult<Record<string, string>>;
    /**
     * The LAPIS base URL for the clinical sequence data used in the variant selector.
     * This is _not_ the same as the LAPIS providing the wastewater amplicon sequences.
     */
    clinicalSequenceLapisBaseUrl: string;
    clinicalSequenceLapisLineageField: string;
}

export function UntrackedFilter({
    pageState,
    setPageState,
    cladeLineageQueryResult: { isPending, isError, data: cladeLineages },
    clinicalSequenceLapisBaseUrl,
    clinicalSequenceLapisLineageField,
}: UntrackedFilterProps) {
    const defaultLineages = cladeLineages ? Object.values(cladeLineages) : [];
    defaultLineages.sort();

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
                    <option value='predefined'>Nextstrain clades</option>
                    <option value='custom'>custom</option>
                </select>
            </LabeledField>
            {pageState.excludeSet === 'predefined' ? (
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
                        <gs-app lapis={clinicalSequenceLapisBaseUrl}>
                            <GsLineageFilter
                                lapisField={clinicalSequenceLapisLineageField}
                                lapisFilter={{}}
                                placeholderText='Variant'
                                value={pageState.excludeVariants}
                                onLineageMultiChange={(lineages) => {
                                    setPageState({
                                        ...pageState,
                                        excludeVariants: lineages[clinicalSequenceLapisLineageField],
                                    });
                                }}
                                hideCounts={true}
                                multiSelect={true}
                            />
                        </gs-app>
                    </LabeledField>
                </>
            )}
        </>
    );
}
