import type { FC } from 'react';

import { PageHeadline } from '../../../styles/containers/PageHeadline.tsx';

export const SelectVariants: FC = () => {
    return (
        <div className='mx-4 mt-20 flex min-h-64 flex-col items-center'>
            <PageHeadline>Compare Variants</PageHeadline>
            <div className='max-w-xl'>
                <p className='mb-2'>To proceed, please select two or more variants in the variant filter.</p>
                <p>
                    Note that the dataset filter is applied to all variants. Adjust the dataset filter as needed to
                    refine your selection.
                </p>
            </div>
        </div>
    );
};
