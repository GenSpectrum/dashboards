import { type FC, useMemo } from 'react';

import { GenericCompareVariantsDataDisplay } from './GenericCompareVariantsDataDisplay';
import { type OrganismsConfig } from '../../../config';
import { SingleVariantOrganismPageLayout } from '../../../layouts/OrganismPage/SingleVariantOrganismPageLayout.tsx';
import { type OrganismViewKey, type OrganismWithViewKey, Routing } from '../../../views/routing';
import { compareVariantsViewKey } from '../../../views/viewKeys';
import { CompareVariantsPageStateSelector } from '../../pageStateSelectors/CompareVariantsPageStateSelector';
import { sanitizeForFilename } from '../compareSideBySide/toDownloadLink';
import { usePageState } from '../usePageState.ts';

export type GenericCompareVariantsReactPageProps = {
    organism: OrganismWithViewKey<typeof compareVariantsViewKey>;
    organismsConfig: OrganismsConfig;
    isStaging: boolean;
};

export const GenericCompareVariantsReactPage: FC<GenericCompareVariantsReactPageProps> = ({
    organism,
    organismsConfig,
    isStaging,
}) => {
    const organismViewKey = `${organism}.${compareVariantsViewKey}` satisfies OrganismViewKey;
    const view = useMemo(
        () => new Routing(organismsConfig).getOrganismView(organismViewKey),
        [organismsConfig, organismViewKey],
    );

    const { pageState, setPageState } = usePageState(view.pageStateHandler);

    const numeratorLapisFilters = view.pageStateHandler.variantFiltersToNamedLapisFilters(pageState);
    const notEnoughVariantsSelected = pageState.variants.size < 2;

    const downloadLinks = notEnoughVariantsSelected
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
                <CompareVariantsPageStateSelector
                    view={view}
                    pageState={pageState}
                    setPageState={setPageState}
                    enableAdvancedQueryFilter={isStaging}
                />
            }
            dataDisplay={<GenericCompareVariantsDataDisplay view={view} pageState={pageState} />}
        />
    );
};
