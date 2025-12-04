import { describe, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { ResistanceMutationsFilter } from './ResistanceMutationsFilter';
import { it } from '../../../../../test-extend';
import { wastewaterOrganismConfigs } from '../../../../types/wastewaterConfig';
import type { WasapResistanceFilter } from '../../../../views/pageStateHandlers/WasapPageStateHandler';

describe('ResistanceMutationsFilter', () => {
    const defaultPageState: WasapResistanceFilter = {
        mode: 'resistance',
        sequenceType: 'amino acid',
        resistanceSet: '3CLpro',
    };

    const resistanceMutationSets = wastewaterOrganismConfigs.covid.resistanceMutationSets;

    it('renders with initial resistance set', async () => {
        const mockSetPageState = vi.fn();

        const { getByRole } = render(
            <ResistanceMutationsFilter
                pageState={defaultPageState}
                setPageState={mockSetPageState}
                resistanceMutationSets={resistanceMutationSets}
            />,
        );

        const select = getByRole('combobox');
        await expect.element(select).toHaveValue('3CLpro');
    });

    it('calls setPageState when selecting a different resistance set', async () => {
        const mockSetPageState = vi.fn();

        const { getByRole } = render(
            <ResistanceMutationsFilter
                pageState={defaultPageState}
                setPageState={mockSetPageState}
                resistanceMutationSets={resistanceMutationSets}
            />,
        );

        const select = getByRole('combobox');
        await select.selectOptions('RdRp');

        expect(mockSetPageState).toHaveBeenCalledWith({
            ...defaultPageState,
            resistanceSet: 'RdRp',
        });
    });
});
