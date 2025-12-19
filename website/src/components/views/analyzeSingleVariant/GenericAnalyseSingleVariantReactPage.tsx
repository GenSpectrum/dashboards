import { type FC, useMemo } from 'react';

import { GenericAnalyseSingleVariantDataDisplay } from './GenericAnalyseSingleVariantDataDisplay';
import { type OrganismsConfig } from '../../../config';
import { SingleVariantOrganismPageLayout } from '../../../layouts/OrganismPage/SingleVariantOrganismPageLayout.tsx';
import { Organisms } from '../../../types/Organism';
import { hasOnlyUndefinedValues } from '../../../util/hasOnlyUndefinedValues';
import { toDisplayName } from '../../../views/pageStateHandlers/PageStateHandler';
import { type OrganismViewKey, type OrganismWithViewKey, Routing } from '../../../views/routing';
import { singleVariantViewKey } from '../../../views/viewKeys';
import { SingleVariantPageStateSelector } from '../../pageStateSelectors/SingleVariantPageStateSelector';
import { sanitizeForFilename } from '../compareSideBySide/toDownloadLink';
import { usePageState } from '../usePageState.ts';

export type GenericAnalyseSingleVariantReactPageProps = {
    organism: Exclude<OrganismWithViewKey<typeof singleVariantViewKey>, typeof Organisms.covid>;
    organismsConfig: OrganismsConfig;
    isStaging: boolean;
};

export const GenericAnalyseSingleVariantReactPage: FC<GenericAnalyseSingleVariantReactPageProps> = ({
    organism,
    organismsConfig,
    isStaging,
}) => {
    const organismViewKey = `${organism}.${singleVariantViewKey}` satisfies OrganismViewKey;
    const view = useMemo(
        () => new Routing(organismsConfig).getOrganismView(organismViewKey),
        [organismsConfig, organismViewKey],
    );

    const { pageState, setPageState } = usePageState(view);

    const variantLapisFilter = view.pageStateHandler.toLapisFilter(pageState);

    const noVariantSelected = hasOnlyUndefinedValues(pageState.variantFilter);

    const displayName = toDisplayName(pageState.variantFilter);
    const downloadLinks = noVariantSelected
        ? [
              {
                  label: 'Download all accessions',
                  filter: variantLapisFilter,
                  downloadFileBasename: `${view.organismConstants.organism}_accessions`,
              },
          ]
        : [
              {
                  label: `Download accessions of "${displayName}"`,
                  filter: variantLapisFilter,
                  downloadFileBasename: `${organism}_${sanitizeForFilename(displayName)}_accessions`,
              },
          ];

    return (
        <SingleVariantOrganismPageLayout
            view={view}
            downloadLinks={downloadLinks}
            organismsConfig={organismsConfig}
            filters={
                <SingleVariantPageStateSelector
                    view={view}
                    pageState={pageState}
                    setPageState={setPageState}
                    enableAdvancedQueryFilter={isStaging}
                />
            }
            dataDisplay={
                <GenericAnalyseSingleVariantDataDisplay view={view} pageState={pageState} setPageState={setPageState} />
            }
        />
    );
};
