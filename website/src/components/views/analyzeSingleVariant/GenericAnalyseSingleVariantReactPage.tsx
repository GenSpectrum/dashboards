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

    const pageState = view.pageStateHandler.parsePageStateFromUrl(new URL(window.location.href));

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
                    organismViewKey={organismViewKey}
                    organismsConfig={organismsConfig}
                    initialPageState={pageState}
                    enableAdvancedQueryFilter={isStaging}
                />
            }
            dataDisplay={
                <GenericAnalyseSingleVariantDataDisplay
                    organismViewKey={organismViewKey}
                    organismsConfig={organismsConfig}
                    pageState={pageState}
                />
            }
        />
    );
};
