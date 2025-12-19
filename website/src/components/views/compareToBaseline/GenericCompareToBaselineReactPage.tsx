import { type FC, useMemo, useState } from 'react';

import { GenericCompareToBaselineDataDisplay } from './GenericCompareToBaselineDataDisplay';
import { type OrganismsConfig } from '../../../config';
import { SingleVariantOrganismPageLayout } from '../../../layouts/OrganismPage/SingleVariantOrganismPageLayout.tsx';
import { type OrganismViewKey, type OrganismWithViewKey, Routing } from '../../../views/routing';
import { compareToBaselineViewKey } from '../../../views/viewKeys';
import { CompareVariantsToBaselineStateSelector } from '../../pageStateSelectors/CompareVariantsToBaselineStateSelector';
import { sanitizeForFilename } from '../compareSideBySide/toDownloadLink';
import { usePageState } from '../usePageState.ts';

export type GenericCompareToBaselineReactPageProps = {
    organism: OrganismWithViewKey<typeof compareToBaselineViewKey>;
    organismsConfig: OrganismsConfig;
    isStaging: boolean;
};

export const GenericCompareToBaselineReactPage: FC<GenericCompareToBaselineReactPageProps> = ({
    organism,
    organismsConfig,
    isStaging,
}) => {
    const organismViewKey = `${organism}.${compareToBaselineViewKey}` satisfies OrganismViewKey;
    const view = useMemo(
        () => new Routing(organismsConfig).getOrganismView(organismViewKey),
        [organismsConfig, organismViewKey],
    );

    const { pageState, setPageState } = usePageState(view.pageStateHandler);

    const numeratorLapisFilters = view.pageStateHandler.variantFiltersToNamedLapisFilters(pageState);
    const noVariantSelected = pageState.variants.size < 1;

    const downloadLinks = noVariantSelected
        ? []
        : numeratorLapisFilters.map(({ lapisFilter, displayName }) => ({
              label: `Download accessions of "${displayName}"`,
              filter: lapisFilter,
              downloadFileBasename: `${organism}_${sanitizeForFilename(displayName)}_accessions`,
          }));

    return (
        <SingleVariantOrganismPageLayout
            view={view}
            downloadLinks={downloadLinks}
            organismsConfig={organismsConfig}
            filters={
                <CompareVariantsToBaselineStateSelector
                    view={view}
                    pageState={pageState}
                    setPageState={setPageState}
                    enableAdvancedQueryFilter={isStaging}
                />
            }
            dataDisplay={<GenericCompareToBaselineDataDisplay view={view} pageState={pageState} />}
        />
    );
};
