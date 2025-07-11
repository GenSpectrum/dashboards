import type { FC, PropsWithChildren } from 'react';

import { PageHeadline } from '../../../styles/containers/PageHeadline';

export type SelectVariantProps = PropsWithChildren;

export const SelectVariant: FC<SelectVariantProps> = ({ children }) => {
    return (
        <div className='border-primary flex w-full flex-col items-center justify-center rounded-sm border-2 p-8'>
            <PageHeadline>Analyze a single variant</PageHeadline>
            <div className='mx-2 flex max-w-xl flex-col text-center'>
                <p>Which variant would you like to explore? Select it from the filter on the left.</p>
                <p>
                    Note that the dataset filter is applied to the entire dataset. Adjust the dataset filter as needed
                    to refine your selection.
                </p>
            </div>
            {children}
        </div>
    );
};
