import { type FC, useMemo } from 'react';

import { CollectionsList } from './CollectionsList.tsx';
import { CovidSingleVariantDataDisplay } from './CovidSingleVariantDataDisplay.tsx';
import type { OrganismsConfig } from '../../../config.ts';
import { SingleVariantOrganismPageLayout } from '../../../layouts/OrganismPage/SingleVariantOrganismPageLayout.tsx';
import { hasOnlyUndefinedValues } from '../../../util/hasOnlyUndefinedValues.ts';
import { toDisplayName } from '../../../views/pageStateHandlers/PageStateHandler.ts';
import { type OrganismViewKey, Routing } from '../../../views/routing.ts';
import { SelectorHeadline } from '../../pageStateSelectors/SelectorHeadline.tsx';
import { SingleVariantPageStateSelector } from '../../pageStateSelectors/SingleVariantPageStateSelector.tsx';
import { sanitizeForFilename } from '../compareSideBySide/toDownloadLink.ts';
import { usePageState } from '../usePageState.ts';

export type CovidSingleVariantReactPageProps = {
    organismsConfig: OrganismsConfig;
    isStaging: boolean;
};

export const CovidSingleVariantReactPage: FC<CovidSingleVariantReactPageProps> = ({ organismsConfig, isStaging }) => {
    const organismViewKey: OrganismViewKey = 'covid.singleVariantView';
    const view = useMemo(() => new Routing(organismsConfig).getOrganismView(organismViewKey), [organismsConfig]);

    const { pageState, setPageState } = usePageState(view);

    const variantFilter = view.pageStateHandler.toLapisFilter(pageState);

    const noVariantSelected = hasOnlyUndefinedValues(pageState.variantFilter);

    const displayName = toDisplayName(pageState.variantFilter);
    const downloadLinks = noVariantSelected
        ? [
              {
                  label: 'Download all accessions',
                  filter: variantFilter,
                  downloadFileBasename: `${view.organismConstants.organism}_accessions`,
              },
          ]
        : [
              {
                  label: `Download accessions of ${displayName}`,
                  filter: variantFilter,
                  downloadFileBasename: `${view.organismConstants.organism}_${sanitizeForFilename(displayName)}_accessions`,
              },
          ];

    return (
        <SingleVariantOrganismPageLayout
            view={view}
            downloadLinks={downloadLinks}
            organismsConfig={organismsConfig}
            filters={
                <>
                    <SingleVariantPageStateSelector
                        view={view}
                        pageState={pageState}
                        setPageState={setPageState}
                        enableAdvancedQueryFilter={isStaging}
                    />
                    <hr className='my-4 border-gray-200' />
                    <div className='mt-4'>
                        <SelectorHeadline>Collections</SelectorHeadline>
                        <CollectionsList
                            initialCollectionId={pageState.collectionId}
                            view={view}
                            pageState={pageState}
                            setPageState={setPageState}
                        />
                    </div>
                </>
            }
            dataDisplay={
                <CovidSingleVariantDataDisplay view={view} pageState={pageState} setPageState={setPageState} />
            }
        />
    );
};
