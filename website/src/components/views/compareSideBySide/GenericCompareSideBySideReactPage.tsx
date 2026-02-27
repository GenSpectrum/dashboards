import { type FC, useMemo, useState, useEffect } from 'react';

import { GenericCompareSideBySideDataDisplay } from './GenericCompareSideBySideDataDisplay.tsx';
import { toDownloadLink } from './toDownloadLink';
import { type OrganismsConfig } from '../../../config';
import { OrganismViewPageLayout } from '../../../layouts/OrganismPage/OrganismViewPageLayout.tsx';
import { type OrganismViewKey, type OrganismWithViewKey, Routing } from '../../../views/routing';
import { compareSideBySideViewKey } from '../../../views/viewKeys';
import { ApplyFilterButton } from '../../pageStateSelectors/ApplyFilterButton.tsx';
import { CompareSideBySidePageStateSelector } from '../../pageStateSelectors/CompareSideBySidePageStateSelector';
import { usePageState } from '../usePageState.ts';

export type GenericCompareSideBySideReactPageProps = {
    organism: OrganismWithViewKey<typeof compareSideBySideViewKey>;
    hideMutationComponents?: boolean;
    organismsConfig: OrganismsConfig;
    isStaging: boolean;
};

export const GenericCompareSideBySideReactPage: FC<GenericCompareSideBySideReactPageProps> = ({
    organism,
    hideMutationComponents,
    organismsConfig,
    isStaging,
}) => {
    const organismViewKey = `${organism}.${compareSideBySideViewKey}` satisfies OrganismViewKey;

    const view = useMemo(
        () => new Routing(organismsConfig).getOrganismView(organismViewKey),
        [organismsConfig, organismViewKey],
    );

    const { pageState, setPageState } = usePageState(view.pageStateHandler);

    const [draftPageState, setDraftPageState] = useState(pageState);
    useEffect(() => setDraftPageState(pageState), [pageState]);

    const downloadLinks = [...pageState.filters.entries()].map(toDownloadLink(view.pageStateHandler, organism));

    const columnsArray = Array.from(pageState.filters);
    const columnCount = columnsArray.length;

    return (
        <OrganismViewPageLayout
            lapisUrl={organismsConfig[organism].lapis.url}
            view={view}
            downloadLinks={downloadLinks}
        >
            <div className='flex'>
                <div className='flex flex-1 flex-col'>
                    <div className='flex overflow-x-auto'>
                        {columnsArray.map(([id]) => (
                            <div
                                key={id}
                                className='flex min-w-125 flex-1 flex-col gap-4 border-r-2 border-gray-200 px-2 pb-4'
                            >
                                {pageState.filters.size > 1 && (
                                    <a
                                        className='block w-full px-2 py-1 text-sm font-light hover:bg-neutral-100'
                                        href={view.pageStateHandler.toUrl(
                                            view.pageStateHandler.removeFilter(pageState, id),
                                        )}
                                    >
                                        Remove column
                                    </a>
                                )}
                                <CompareSideBySidePageStateSelector
                                    view={view}
                                    filterId={id}
                                    draftPageState={draftPageState}
                                    setDraftPageState={setDraftPageState}
                                    enableAdvancedQueryFilter={isStaging}
                                />
                            </div>
                        ))}
                    </div>

                    <div className='border-t-2 border-r-2 border-b-2 border-gray-200 bg-gray-50 p-2'>
                        <div className='flex justify-center'>
                            <ApplyFilterButton
                                pageStateHandler={view.pageStateHandler}
                                newPageState={draftPageState}
                                setPageState={setPageState}
                                className='min-w-50'
                            />
                        </div>
                    </div>

                    <div
                        className='grid overflow-x-auto'
                        style={{
                            gridTemplateColumns: `repeat(${columnCount}, minmax(500px, 1fr))`,
                            gridAutoRows: 'auto',
                        }}
                    >
                        {columnsArray.map(([id, datasetAndVariantData], colIndex) => (
                            <div key={id} className='contents'>
                                <GenericCompareSideBySideDataDisplay
                                    view={view}
                                    datasetAndVariantData={datasetAndVariantData}
                                    hideMutationComponents={hideMutationComponents}
                                    columnIndex={colIndex}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    className='px-8 py-4 text-left text-sm font-light hover:bg-neutral-100'
                    onClick={() => setPageState(view.pageStateHandler.addEmptyFilter(pageState))}
                    style={{ writingMode: 'vertical-rl' }}
                >
                    Add column
                </button>
            </div>
        </OrganismViewPageLayout>
    );
};
