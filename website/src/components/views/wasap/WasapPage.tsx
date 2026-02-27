import type { MeanProportionInterval } from '@genspectrum/dashboard-components/util';
import { useMemo } from 'react';
import { type FC } from 'react';

import { CollectionInfo } from './components/CollectionInfo';
import { NoDataHelperText } from './components/NoDataHelperText';
import { VariantFetchInfo } from './components/VariantFetchInfo';
import { WasapStats } from './components/WasapStats';
import { toMutationAnnotations } from './resistanceMutations';
import { useWasapPageData } from './useWasapPageData';
import { defaultBreadcrumbs } from '../../../layouts/Breadcrumbs.tsx';
import { DataPageLayout } from '../../../layouts/OrganismPage/DataPageLayout.tsx';
import { dataOrigins } from '../../../types/dataOrigins.ts';
import {
    wastewaterBreadcrumb,
    wastewaterOrganismConfigs,
    type WastewaterOrganismName,
} from '../../../types/wastewaterConfig';
import { Loading } from '../../../util/Loading';
import { WasapPageStateHandler } from '../../../views/pageStateHandlers/WasapPageStateHandler';
import { GsMutationsOverTime } from '../../genspectrum/GsMutationsOverTime';
import { GsQueriesOverTime } from '../../genspectrum/GsQueriesOverTime.tsx';
import { WasapPageStateSelector } from '../../pageStateSelectors/wasap/WasapPageStateSelector';
import { withQueryProvider } from '../../subscriptions/backendApi/withQueryProvider';
import { usePageState } from '../usePageState.ts';

export type WasapPageProps = {
    wastewaterOrganism: WastewaterOrganismName;
    isStaging: boolean;
};

export const WasapPageInner: FC<WasapPageProps> = ({ wastewaterOrganism, isStaging }) => {
    const config = wastewaterOrganismConfigs[wastewaterOrganism];
    // initialize page state from the URL
    const pageStateHandler = useMemo(() => new WasapPageStateHandler(config), [config]);

    const {
        pageState: { base, analysis },
        setPageState,
    } = usePageState(pageStateHandler);

    // fetch which mutations should be analyzed
    const { data, isPending, isError } = useWasapPageData(config, analysis);

    let initialMeanProportionInterval: MeanProportionInterval = { min: 0.0, max: 1.0 };
    if (analysis.mode === 'manual' && analysis.mutations === undefined) {
        initialMeanProportionInterval = { min: 0.05, max: 0.95 };
    }

    const lapisFilter = {
        ...(base.locationName && { locationName: base.locationName }),
        ...(base.samplingDate?.dateFrom && { samplingDateFrom: base.samplingDate.dateFrom }),
        ...(base.samplingDate?.dateTo && { samplingDateTo: base.samplingDate.dateTo }),
    };

    const memoizedMutationAnnotations = useMemo(
        () =>
            JSON.stringify(
                config.resistanceAnalysisModeEnabled
                    ? config.resistanceMutationSets.flatMap((resistanceMutation) =>
                          toMutationAnnotations(resistanceMutation),
                      )
                    : [],
            ),
        [config],
    );
    const memoizedLinkTemplate = useMemo(() => JSON.stringify(config.linkTemplate), [config.linkTemplate]);

    return (
        <DataPageLayout
            breadcrumbs={[
                ...defaultBreadcrumbs,
                wastewaterBreadcrumb,
                {
                    name: config.name,
                    href: config.path,
                },
            ]}
            dataOrigins={[dataOrigins.wise]}
            lapisUrl={config.lapisBaseUrl}
        >
            <gs-app
                lapis={config.lapisBaseUrl}
                mutationAnnotations={memoizedMutationAnnotations}
                mutationLinkTemplate={memoizedLinkTemplate}
            >
                <div className='grid-cols-[300px_1fr] gap-x-4 lg:grid'>
                    <div className='h-fit p-2 shadow-lg'>
                        <WasapPageStateSelector
                            config={config}
                            pageStateHandler={pageStateHandler}
                            initialBaseFilterState={base}
                            initialAnalysisFilterState={analysis}
                            setPageState={setPageState}
                            isStaging={isStaging}
                        />
                    </div>
                    {isError ? (
                        <span>There was an error fetching the data to display.</span>
                    ) : isPending ? (
                        <Loading />
                    ) : (
                        <div className='h-full space-y-4 pr-4'>
                            {data.type === 'mutations' ? (
                                <>
                                    {data.displayMutations?.length === 0 ? (
                                        <NoDataHelperText analysisFilter={analysis} />
                                    ) : (
                                        <GsMutationsOverTime
                                            lapisFilter={lapisFilter}
                                            granularity={base.granularity as 'day' | 'week'}
                                            lapisDateField={config.samplingDateField}
                                            sequenceType={
                                                'sequenceType' in analysis ? analysis.sequenceType : 'nucleotide'
                                            }
                                            displayMutations={data.displayMutations}
                                            pageSizes={[20, 50, 100, 250]}
                                            useNewEndpoint={true}
                                            initialMeanProportionInterval={initialMeanProportionInterval}
                                            hideGaps={base.excludeEmpty ? true : undefined}
                                            customColumns={data.customColumns}
                                        />
                                    )}
                                    {analysis.mode === 'variant' && config.variantAnalysisModeEnabled && (
                                        <VariantFetchInfo
                                            analysis={analysis}
                                            clinicalLapisBaseUrl={config.clinicalLapis.lapisBaseUrl}
                                            clinicalLapisLineageField={config.clinicalLapis.lineageField}
                                            clinicalLapisDateField={config.clinicalLapis.dateField}
                                            warningThreshold={config.clinicalSequenceCountWarningThreshold}
                                        />
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className='rounded-md border-2 border-gray-100 p-4'>
                                        <GsQueriesOverTime
                                            collectionTitle={data.collection.title}
                                            lapisFilter={lapisFilter}
                                            queries={data.collection.queries}
                                            granularity={base.granularity}
                                            lapisDateField={config.samplingDateField}
                                            pageSizes={[20, 50, 100, 250]}
                                            initialMeanProportionInterval={initialMeanProportionInterval}
                                            hideGaps={base.excludeEmpty ? true : undefined}
                                        />
                                    </div>
                                    <CollectionInfo
                                        collectionId={data.collection.id}
                                        collectionTitle={data.collection.title}
                                        invalidVariants={data.invalidVariants}
                                    />
                                </>
                            )}
                            <WasapStats config={config} />
                        </div>
                    )}
                </div>
            </gs-app>
        </DataPageLayout>
    );
};

export const WasapPage = withQueryProvider(WasapPageInner);
