import type { FC, PropsWithChildren } from 'react';

import { type DownloadLink } from './AccessionsDownloadButton.tsx';
import { DataPageLayout } from './DataPageLayout.tsx';
import type { OrganismConstants } from '../../views/OrganismConstants';
import { type View } from '../../views/View';
import type { PageStateHandler } from '../../views/pageStateHandlers/PageStateHandler';

export type OrganismViewPageLayoutProps = PropsWithChildren<{
    view: View<object, OrganismConstants, PageStateHandler<object>>;
    downloadLinks: DownloadLink[];
    lapisUrl: string;
}>;

export const OrganismViewPageLayout: FC<OrganismViewPageLayoutProps> = ({
    view,
    downloadLinks,
    lapisUrl,
    children,
}) => {
    return (
        <DataPageLayout
            breadcrumbs={view.viewBreadcrumbEntries}
            downloadLinks={downloadLinks}
            dataOrigins={view.organismConstants.dataOrigins}
            lapisUrl={lapisUrl}
            accessionDownloadFields={view.organismConstants.accessionDownloadFields}
        >
            <gs-app lapis={lapisUrl} mutationAnnotations={JSON.stringify(view.organismConstants.mutationAnnotations)}>
                {children}
            </gs-app>
        </DataPageLayout>
    );
};
