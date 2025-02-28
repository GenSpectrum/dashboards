import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { SingleVariantPageStateSelector } from './SingleVariantPageStateSelector.tsx';
import { DUMMY_LAPIS_URL, lapisRequestMocks, testOrganismsConfig } from '../../../vitest.setup.ts';

describe('SingleVariantPageStateSelector', () => {
    test('should remember the covid collection id', () => {
        lapisRequestMocks.postAggregated({}, { data: [] });
        lapisRequestMocks.referenceGenome({ nucleotideSequences: [{ name: 'main', sequence: 'ATGC' }], genes: [] });

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
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <SingleVariantPageStateSelector
                    locationFilterConfig={{
                        locationFields: ['region', 'country', 'division'],
                        placeholderText: 'Location',
                    }}
                    organismViewKey='covid.singleVariantView'
                    organismsConfig={testOrganismsConfig}
                    pageState={pageState}
                />
            </gs-app>,
        );

        expect(getByRole('button')).toHaveAttribute('href', expect.stringContaining('collectionId=5'));
    });
});
