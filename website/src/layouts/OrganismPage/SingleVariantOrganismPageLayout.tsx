import type { FC, ReactNode } from 'react';

import { type DownloadLink } from './AccessionsDownloadButton.tsx';
import { OrganismViewPageLayout } from './OrganismViewPageLayout.tsx';
import type { OrganismsConfig } from '../../config.ts';
import type { OrganismConstants } from '../../views/OrganismConstants';
import type { View } from '../../views/View';
import { type PageStateHandler } from '../../views/pageStateHandlers/PageStateHandler';

export type SingleVariantOrganismPageLayoutProps = {
    view: View<object, OrganismConstants, PageStateHandler<object>>;
    downloadLinks: DownloadLink[];
    organismsConfig: OrganismsConfig;
    filters: ReactNode;
    dataDisplay: ReactNode;
};

export const SingleVariantOrganismPageLayout: FC<SingleVariantOrganismPageLayoutProps> = ({
    view,
    downloadLinks,
    organismsConfig,
    filters,
    dataDisplay,
}) => {
    return (
        <OrganismViewPageLayout
            view={view}
            downloadLinks={downloadLinks}
            lapisUrl={organismsConfig[view.organismConstants.organism].lapis.url}
        >
            <div className='grid-cols-[300px_1fr] gap-x-4 lg:grid'>
                <div className='h-fit p-2 shadow-lg'>{filters}</div>
                {dataDisplay}
            </div>
        </OrganismViewPageLayout>
    );
};
