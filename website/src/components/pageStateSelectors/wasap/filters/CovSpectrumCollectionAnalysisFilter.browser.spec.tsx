import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { CovSpectrumCollectionAnalysisFilter } from './CovSpectrumCollectionAnalysisFilter';
import { it } from '../../../../../test-extend';
import type { CollectionRaw } from '../../../../covspectrum/types';
import type { WasapCovSpectrumCollectionFilter } from '../../../views/wasap/wasapPageConfig';

const DUMMY_COV_SPECTRUM_URL = 'https://cov-spectrum-dummy.com/api';

const mockCollections: CollectionRaw[] = [
    {
        id: 42,
        title: '3CLpro',
        description: 'Test collection',
        maintainers: 'Test',
        email: 'test@example.com',
        variants: [{ query: '{}', name: 'Variant 1', description: 'Desc 1', highlighted: false }],
    },
    {
        id: 99,
        title: 'RdRp',
        description: 'Another collection',
        maintainers: 'Test',
        email: 'test@example.com',
        variants: [],
    },
];

const queryClient = new QueryClient();

describe('CovSpectrumCollectionAnalysisFilter', () => {
    const defaultPageState: WasapCovSpectrumCollectionFilter = {
        mode: 'covSpectrumCollection',
        collectionId: 42,
    };

    it('renders with initial collection set', async ({ routeMockers: { covSpectrum } }) => {
        const mockSetPageState = vi.fn();

        covSpectrum.mockGetCollections(DUMMY_COV_SPECTRUM_URL, mockCollections);

        const { getByRole } = render(
            <QueryClientProvider client={queryClient}>
                <CovSpectrumCollectionAnalysisFilter
                    pageState={defaultPageState}
                    setPageState={mockSetPageState}
                    collectionsApiBaseUrl={DUMMY_COV_SPECTRUM_URL}
                    collectionTitleFilter='pro'
                />
            </QueryClientProvider>,
        );

        const select = getByRole('combobox');
        await expect.element(select).toHaveValue('42'); // collectionId from defaultPageState
    });

    it('calls setPageState when selecting a different collection', async ({ routeMockers: { covSpectrum } }) => {
        const mockSetPageState = vi.fn();

        covSpectrum.mockGetCollections(DUMMY_COV_SPECTRUM_URL, mockCollections);

        const { getByRole } = render(
            <QueryClientProvider client={queryClient}>
                <CovSpectrumCollectionAnalysisFilter
                    pageState={defaultPageState}
                    setPageState={mockSetPageState}
                    collectionsApiBaseUrl={DUMMY_COV_SPECTRUM_URL}
                    collectionTitleFilter='r'
                />
            </QueryClientProvider>,
        );

        const select = getByRole('combobox');
        await select.selectOptions('99'); // Select RdRp collection

        expect(mockSetPageState).toHaveBeenCalledWith({
            ...defaultPageState,
            collectionId: 99,
        });
    });
});
