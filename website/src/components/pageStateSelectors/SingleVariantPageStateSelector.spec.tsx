import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { SingleVariantPageStateSelector } from './SingleVariantPageStateSelector.tsx';
import { testOrganismsConfig } from '../../../vitest.setup.ts';

describe('SingleVariantPageStateSelector', () => {
    test('should remember the covid collection id', () => {
        const pageState = {
            datasetFilter: {
                location: {},
                dateFilters: {},
                textFilters: {},
            },
            variantFilter: {},
            collectionId: 5,
        };

        const { getByRole } = render(
            <SingleVariantPageStateSelector
                locationFilterConfig={{
                    locationFields: ['region', 'country', 'division'],
                    placeholderText: 'Location',
                }}
                organismViewKey='covid.singleVariantView'
                organismsConfig={testOrganismsConfig}
                pageState={pageState}
            />,
        );

        expect(getByRole('button')).toHaveAttribute('href', expect.stringContaining('collectionId=5'));
    });
});
