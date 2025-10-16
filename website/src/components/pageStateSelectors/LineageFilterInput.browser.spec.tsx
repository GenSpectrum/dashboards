import { describe, expect } from 'vitest';
import { render } from 'vitest-browser-react';

import { LineageFilterInput, type LineageFilterConfig } from './LineageFilterInput';
import { DUMMY_LAPIS_URL } from '../../../routeMocker';
import { it } from '../../../test-extend';

describe('LineageFilterInput', () => {
    it('renders with correct options', async ({ routeMockers }) => {
        routeMockers.lapis.mockReferenceGenome({
            nucleotideSequences: [{ name: 'main', sequence: 'ATGC' }],
            genes: [],
        });
        /* eslint-disable @typescript-eslint/naming-convention */
        routeMockers.lapis.mockLineageDefinition('pangoLineage', {
            'A': { aliases: ['a'] },
            'A.1': { parents: ['A'], aliases: ['a.1'] },
            'A.11': { parents: ['A'], aliases: ['a.11'] },
        });
        /* eslint-enable @typescript-eslint/naming-convention */
        routeMockers.lapis.mockPostAggregated(
            { fields: ['pangoLineage'] },
            {
                data: [
                    {
                        count: 1364,
                        pangoLineage: 'A',
                    },
                    {
                        count: 2981,
                        pangoLineage: 'A.1',
                    },
                    {
                        count: 10,
                        pangoLineage: 'A.11',
                    },
                ],
            },
        );

        const config: LineageFilterConfig = {
            placeholderText: 'lineage',
            lapisField: 'pangoLineage',
            filterType: 'lineage',
        };

        const screen = render(
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <LineageFilterInput
                    lineageFilterConfig={config}
                    onLineageChange={() => {}}
                    lapisFilter={{}}
                    value={undefined}
                />
            </gs-app>,
        );

        await expect.element(screen.getByText('A(1364)')).toBeInTheDocument();
        const options = screen.getByRole('option', { includeHidden: true }).elements();
        expect(options).toHaveLength(6);
        const texts = options.map((o) => o.textContent);

        expect(texts).toContain('A(1364)');
        expect(texts).toContain('A.1(2981)');
        expect(texts).toContain('A.1*(2981)');
    });
});
