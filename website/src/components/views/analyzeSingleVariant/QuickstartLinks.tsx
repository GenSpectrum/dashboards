import type { FC } from 'react';

import { collectionVariantClassName } from './CollectionsList';
import { Organisms } from '../../../types/Organism';
import type { DatasetFilter } from '../../../views/View.ts';
import { toDisplayName } from '../../../views/pageStateHandlers/PageStateHandler';
import type { SingleVariantOrganism, ViewsMap } from '../../../views/routing';
import { singleVariantViewKey } from '../../../views/viewKeys';

export type QuickstartLinksProps = {
    view: ViewsMap[Exclude<SingleVariantOrganism, typeof Organisms.covid>][typeof singleVariantViewKey];
    datasetFilter: DatasetFilter;
};

export const QuickstartLinks: FC<QuickstartLinksProps> = ({ view, datasetFilter }) => {
    const variants = view.organismConstants.predefinedVariants;

    return (
        <div className='text-center'>
            <p className='mt-4 mb-2'>To get started you can choose one of these variants:</p>

            <div className='flex max-w-md flex-col'>
                {variants.map((variant) => {
                    const href = view.pageStateHandler.toUrl({
                        datasetFilter: datasetFilter,
                        variantFilter: variant,
                    });
                    return (
                        <a key={href} className={collectionVariantClassName} href={href}>
                            {toDisplayName(variant)}
                        </a>
                    );
                })}
            </div>
        </div>
    );
};
