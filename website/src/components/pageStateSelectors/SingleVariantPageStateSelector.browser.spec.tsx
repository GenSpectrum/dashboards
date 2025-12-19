import { act } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect } from 'vitest';
import { render, renderHook } from 'vitest-browser-react';

import { SingleVariantPageStateSelector } from './SingleVariantPageStateSelector.tsx';
import { DUMMY_LAPIS_URL, testOrganismsConfig } from '../../../routeMocker.ts';
import { it } from '../../../test-extend';
import type { CovidVariantData } from '../../views/covid.ts';
import { Routing } from '../../views/routing.ts';

describe('SingleVariantPageStateSelector', () => {
    it('should remember the covid collection id', async ({ routeMockers }) => {
        routeMockers.lapis.mockPostAggregated({}, { data: [] });
        routeMockers.lapis.mockReferenceGenome({
            nucleotideSequences: [{ name: 'main', sequence: 'ATGC' }],
            genes: [],
        });
        routeMockers.lapis.mockLineageDefinition('nextcladePangoLineage', {});

        const { result } = renderHook(() =>
            useState<CovidVariantData>({
                datasetFilter: {
                    locationFilters: {},
                    dateFilters: {},
                    textFilters: {},
                    numberFilters: {},
                },
                variantFilter: {},
                collectionId: 5,
            }),
        );

        const { getByRole } = render(
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <SingleVariantPageStateSelector
                    view={new Routing(testOrganismsConfig).getOrganismView('covid.singleVariantView')}
                    pageState={result.current[0]}
                    setPageState={result.current[1]}
                    enableAdvancedQueryFilter={true}
                />
            </gs-app>,
        );

        await act(async () => {
            await getByRole('button', { name: 'Apply filters' }).click();
        });

        expect(result.current[0].collectionId).equals(5);
    });
});
