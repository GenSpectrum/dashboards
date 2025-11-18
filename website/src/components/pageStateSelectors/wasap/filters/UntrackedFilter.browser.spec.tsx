import { type UseQueryResult } from '@tanstack/react-query';
import { userEvent } from '@vitest/browser/context';
import { describe, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { UntrackedFilter } from './UntrackedFilter';
import type { LapisRouteMocker } from '../../../../../routeMocker';
import { it } from '../../../../../test-extend';
import type { WasapUntrackedFilter } from '../../../../views/pageStateHandlers/WasapPageStateHandler';

const DUMMY_LAPIS_URL_2 = 'http://lapis2.dummy';

describe('UntrackedFilter - custom variants textarea', () => {
    const mockCladeLineageQueryResult = {
        isPending: false,
        isError: false,
        data: {},
    } as UseQueryResult<Record<string, string>>;

    const defaultPageState: WasapUntrackedFilter = {
        mode: 'untracked',
        sequenceType: 'nucleotide',
        excludeSet: 'custom',
        excludeVariants: [],
    };

    it('sets multiple variants when multiple are selected', async ({ routeMockers: { lapis } }) => {
        setupLapisMocks(lapis);
        const mockSetPageState = vi.fn();

        const { getByRole } = render(
            <UntrackedFilter
                pageState={defaultPageState}
                setPageState={mockSetPageState}
                clinicalSequenceLapisBaseUrl={DUMMY_LAPIS_URL_2}
                cladeLineageQueryResult={mockCladeLineageQueryResult}
            />,
        );

        const variantCombobox = await vi.waitFor(() => getByRole('combobox', { name: /variant/i }));

        await userEvent.click(variantCombobox);

        const option = await vi.waitFor(() => getByRole('option', { name: 'JN.1', exact: true }));
        await option.click();

        await vi.waitFor(() => {
            expect(mockSetPageState).toHaveBeenCalledWith({
                ...defaultPageState,
                excludeVariants: ['JN.1'],
            });
        });

        const option2 = await vi.waitFor(() => getByRole('option', { name: 'KP.2', exact: true }));
        await option2.click();

        await vi.waitFor(() => {
            expect(mockSetPageState).toHaveBeenCalledWith({
                ...defaultPageState,
                excludeVariants: ['JN.1', 'KP.2'],
            });
        });
    });
});

function setupLapisMocks(lapisRouteMocker: LapisRouteMocker) {
    const sequence = 'ATGC'.repeat(5000); // 20,000 base pairs
    lapisRouteMocker.mockReferenceGenome({
        nucleotideSequences: [{ name: 'main', sequence }],
        genes: [{ name: 'S', sequence }],
    });
    /* eslint-disable @typescript-eslint/naming-convention */
    lapisRouteMocker.mockLineageDefinition('pangoLineage', {
        'JN.1': { parents: ['BA.2'], aliases: [] },
        'KP.2': { parents: ['JN.1'], aliases: [] },
        'BA.2': { parents: ['B.1.1.529'], aliases: [] },
    });
    /* eslint-enable @typescript-eslint/naming-convention */

    // Mocks for the internal gs-app that uses the other LAPIS URL

    lapisRouteMocker.mockReferenceGenomeWithUrl(DUMMY_LAPIS_URL_2, {
        nucleotideSequences: [{ name: 'main', sequence }],
        genes: [{ name: 'S', sequence }],
    });

    /* eslint-disable @typescript-eslint/naming-convention */
    lapisRouteMocker.mockLineageDefinitionWithUrl(DUMMY_LAPIS_URL_2, 'pangoLineage', {
        'JN.1': { parents: ['BA.2'], aliases: [] },
        'KP.2': { parents: ['JN.1'], aliases: [] },
        'BA.2': { parents: ['B.1.1.529'], aliases: [] },
    });
    /* eslint-enable @typescript-eslint/naming-convention */

    lapisRouteMocker.mockPostAggregatedWithUrl(
        DUMMY_LAPIS_URL_2,
        { fields: ['pangoLineage'] },
        {
            data: [
                { count: 688569, pangoLineage: 'B.1.1.7' },
                { count: 314323, pangoLineage: 'BA.1' },
                { count: 54887, pangoLineage: 'B.1' },
                { count: 25101, pangoLineage: 'B.1.1' },
                { count: 20322, pangoLineage: 'P.1' },
                { count: 20018, pangoLineage: 'KP.3.1.1' },
                { count: 11424, pangoLineage: 'D.2' },
                { count: 6916, pangoLineage: 'JN.1' },
                { count: 3197, pangoLineage: 'KP.2' },
                { count: 2191, pangoLineage: 'C.37' },
                { count: 1599, pangoLineage: 'KP.3' },
                { count: 1481, pangoLineage: 'P.1.15' },
                { count: 1364, pangoLineage: 'A' },
            ],
        },
    );
}
