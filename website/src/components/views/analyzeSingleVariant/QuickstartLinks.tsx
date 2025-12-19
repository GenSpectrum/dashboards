import type { Dispatch, FC, SetStateAction } from 'react';

import { collectionVariantClassName } from './CollectionsList';
import { Organisms } from '../../../types/Organism';
import type { DatasetAndVariantData, DatasetFilter } from '../../../views/View.ts';
import { toDisplayName } from '../../../views/pageStateHandlers/PageStateHandler';
import type { SingleVariantOrganism, ViewsMap } from '../../../views/routing';
import { singleVariantViewKey } from '../../../views/viewKeys';

export type QuickstartLinksProps = {
    view: ViewsMap[Exclude<SingleVariantOrganism, typeof Organisms.covid>][typeof singleVariantViewKey];
    datasetFilter: DatasetFilter;
    setPageState: Dispatch<SetStateAction<DatasetAndVariantData>>;
};

export const QuickstartLinks: FC<QuickstartLinksProps> = ({ view, datasetFilter, setPageState }) => {
    const variants = view.organismConstants.predefinedVariants;

    return (
        <div className='text-center'>
            <p className='mt-4 mb-2'>To get started you can choose one of these variants:</p>

            <div className='flex max-w-md flex-col'>
                {variants.map((variant) => {
                    const applyFilters = () => {
                        setPageState({
                            datasetFilter: datasetFilter,
                            variantFilter: variant,
                        });
                    };

                    const displayName = toDisplayName(variant);
                    return (
                        <a key={displayName} className={collectionVariantClassName} onClick={applyFilters}>
                            {displayName}
                        </a>
                    );
                })}
            </div>
        </div>
    );
};
