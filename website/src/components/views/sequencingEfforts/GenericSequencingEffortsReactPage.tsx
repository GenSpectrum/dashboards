import { type FC, useMemo } from 'react';

import { GenericSequencingEffortsDataDisplay } from './GenericSequencingEffortsDataDisplay';
import { type OrganismsConfig } from '../../../config';
import { SingleVariantOrganismPageLayout } from '../../../layouts/OrganismPage/SingleVariantOrganismPageLayout.tsx';
import { type OrganismViewKey, type OrganismWithViewKey, Routing } from '../../../views/routing';
import { sequencingEffortsViewKey } from '../../../views/viewKeys';
import { SequencingEffortsPageStateSelector } from '../../pageStateSelectors/SequencingEffortsPageStateSelector';
import { usePageState } from '../usePageState.ts';

export type GenericSequencingEffortsReactPageProps = {
    organism: OrganismWithViewKey<typeof sequencingEffortsViewKey>;
    organismsConfig: OrganismsConfig;
    isStaging: boolean;
};

export const GenericSequencingEffortsReactPage: FC<GenericSequencingEffortsReactPageProps> = ({
    organism,
    organismsConfig,
    isStaging,
}) => {
    const organismViewKey = `${organism}.${sequencingEffortsViewKey}` satisfies OrganismViewKey;
    const view = useMemo(
        () => new Routing(organismsConfig).getOrganismView(organismViewKey),
        [organismsConfig, organismViewKey],
    );

    const { pageState, setPageState } = usePageState(view.pageStateHandler);

    const lapisFilter = view.pageStateHandler.toLapisFilter(pageState);

    const downloadLinks = [
        {
            label: 'Download accessions',
            filter: lapisFilter,
            downloadFileBasename: `${organism}_sequencing_efforts_accessions`,
        },
    ];

    return (
        <SingleVariantOrganismPageLayout
            view={view}
            downloadLinks={downloadLinks}
            organismsConfig={organismsConfig}
            filters={
                <SequencingEffortsPageStateSelector
                    view={view}
                    pageState={pageState}
                    setPageState={setPageState}
                    enableAdvancedQueryFilter={isStaging}
                />
            }
            dataDisplay={
                <GenericSequencingEffortsDataDisplay
                    organismViewKey={organismViewKey}
                    organismsConfig={organismsConfig}
                    pageState={pageState}
                />
            }
        />
    );
};
