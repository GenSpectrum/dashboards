import { describe, expect } from 'vitest';
import { render } from 'vitest-browser-react';

import { SingleVariantPageStateSelector } from './SingleVariantPageStateSelector.tsx';
import { DUMMY_LAPIS_URL, testOrganismsConfig } from '../../../routeMocker.ts';
import { it } from '../../../test-extend';

describe('SingleVariantPageStateSelector', () => {
    it('should remember the covid collection id', ({ routeMockers }) => {
        routeMockers.lapis.mockPostAggregated({}, { data: [] });
        routeMockers.lapis.mockReferenceGenome({
            nucleotideSequences: [{ name: 'main', sequence: 'ATGC' }],
            genes: [],
        });

        const initialPageState = {
            datasetFilter: {
                locationFilters: {},
                dateFilters: {},
                textFilters: {},
                numberFilters: {},
            },
            variantFilter: {},
            collectionId: 5,
        };

        const { getByRole } = render(
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <SingleVariantPageStateSelector
                    organismViewKey='covid.singleVariantView'
                    organismsConfig={testOrganismsConfig}
                    pageState={initialPageState}
                    enableAdvancedQueryFilter={true}
                />
            </gs-app>,
        );

        expect(getByRole('button').element()).toHaveAttribute('href', expect.stringContaining('collectionId=5'));
    });
});
