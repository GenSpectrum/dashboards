import { type FC, useMemo, useState } from 'react';

import { GenericCompareSideBySideDataDisplay } from './GenericCompareSideBySideDataDisplay.tsx';
import { toDownloadLink } from './toDownloadLink';
import { type OrganismsConfig } from '../../../config';
import { OrganismViewPageLayout } from '../../../layouts/OrganismPage/OrganismViewPageLayout.tsx';
import { type OrganismViewKey, type OrganismWithViewKey, Routing } from '../../../views/routing';
import { compareSideBySideViewKey } from '../../../views/viewKeys';
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

    const downloadLinks = [...pageState.filters.entries()].map(toDownloadLink(view.pageStateHandler, organism));

    return (
        <OrganismViewPageLayout
            lapisUrl={organismsConfig[organism].lapis.url}
            view={view}
            downloadLinks={downloadLinks}
        >
            <div className='flex overflow-x-auto'>
                {Array.from(pageState.filters).map(([id, datasetAndVariantData]) => {
                    return (
                        <div
                            key={id}
                            className='flex min-w-[500px] flex-1 flex-col gap-4 border-r-2 border-gray-200 px-2'
                        >
                            <div className='mb-4'>
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
                                    pageState={pageState}
                                    setPageState={setPageState}
                                    enableAdvancedQueryFilter={isStaging}
                                />
                            </div>

                            <GenericCompareSideBySideDataDisplay
                                view={view}
                                datasetAndVariantData={datasetAndVariantData}
                                hideMutationComponents={hideMutationComponents}
                            />
                        </div>
                    );
                })}
                <a
                    className='py-4 pt-8 text-left text-sm font-light hover:bg-neutral-100'
                    href={view.pageStateHandler.toUrl(view.pageStateHandler.addEmptyFilter(pageState))}
                    style={{ writingMode: 'vertical-rl' }}
                >
                    Add column
                </a>
            </div>
        </OrganismViewPageLayout>
    );
};
