import { describe, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { ManualAnalysisFilter } from './ManualAnalysisFilter';
import { DUMMY_LAPIS_URL, type LapisRouteMocker } from '../../../../../routeMocker';
import { it } from '../../../../../test-extend';
import type { WasapManualFilter } from '../../../views/wasap/wasapPageConfig';

describe('ManualAnalysisFilter', () => {
    const defaultPageState: WasapManualFilter = {
        mode: 'manual',
        sequenceType: 'nucleotide',
        mutations: undefined,
    };

    it('renders with nucleotide sequence type selected', async ({ routeMockers: { lapis } }) => {
        setupLapisMocks(lapis);
        const mockSetPageState = vi.fn();

        const { getByLabelText } = render(
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <ManualAnalysisFilter pageState={defaultPageState} setPageState={mockSetPageState} />
            </gs-app>,
        );

        const nucleotideRadio = getByLabelText('Nucleotide');
        await expect.element(nucleotideRadio).toBeChecked();
    });

    it('renders with amino acid sequence type selected', async ({ routeMockers: { lapis } }) => {
        setupLapisMocks(lapis);
        const mockSetPageState = vi.fn();
        const pageState: WasapManualFilter = {
            ...defaultPageState,
            sequenceType: 'amino acid',
        };

        const { getByLabelText } = render(
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <ManualAnalysisFilter pageState={pageState} setPageState={mockSetPageState} />
            </gs-app>,
        );

        const aminoAcidRadio = getByLabelText('Amino acid');
        await expect.element(aminoAcidRadio).toBeChecked();
    });

    it('clears mutations when changing sequence type', async ({ routeMockers: { lapis } }) => {
        setupLapisMocks(lapis);
        const mockSetPageState = vi.fn();
        const pageState: WasapManualFilter = {
            ...defaultPageState,
            sequenceType: 'nucleotide',
            mutations: ['A23T'],
        };

        const { getByLabelText } = render(
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <ManualAnalysisFilter pageState={pageState} setPageState={mockSetPageState} />
            </gs-app>,
        );

        const aminoAcidRadio = getByLabelText('Amino acid');
        await aminoAcidRadio.click();

        expect(mockSetPageState).toHaveBeenCalledWith({
            mode: 'manual',
            sequenceType: 'amino acid',
            mutations: undefined,
        });
    });

    it('does not call setPageState when clicking the already selected sequence type', async ({
        routeMockers: { lapis },
    }) => {
        setupLapisMocks(lapis);
        const mockSetPageState = vi.fn();

        const { getByLabelText } = render(
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <ManualAnalysisFilter pageState={defaultPageState} setPageState={mockSetPageState} />
            </gs-app>,
        );

        const nucleotideRadio = getByLabelText('Nucleotide');
        await nucleotideRadio.click();

        expect(mockSetPageState).not.toHaveBeenCalled();
    });

    it('calls setPageState with nucleotide mutation when entering and confirming A23T', async ({
        routeMockers: { lapis },
    }) => {
        setupLapisMocks(lapis);
        const mockSetPageState = vi.fn();

        const { getByRole } = render(
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <ManualAnalysisFilter pageState={defaultPageState} setPageState={mockSetPageState} />
            </gs-app>,
        );

        const mutationInput = getByRole('combobox');
        await mutationInput.fill('A23T');
        const option = await vi.waitFor(() => getByRole('option', { name: 'A23T', exact: true }));
        await option.click();

        await vi.waitFor(() => {
            expect(mockSetPageState).toHaveBeenCalledWith({
                ...defaultPageState,
                mutations: ['A23T'],
            });
        });
    });

    it('calls setPageState with amino acid mutation when in amino acid mode', async ({ routeMockers: { lapis } }) => {
        setupLapisMocks(lapis);
        const mockSetPageState = vi.fn();
        const pageState: WasapManualFilter = {
            ...defaultPageState,
            sequenceType: 'amino acid',
        };

        const { getByRole } = render(
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <ManualAnalysisFilter pageState={pageState} setPageState={mockSetPageState} />
            </gs-app>,
        );

        const mutationInput = getByRole('combobox');
        await mutationInput.fill('S:E484K');
        const option = await vi.waitFor(() => getByRole('option', { name: 'S:E484K', exact: true }));
        await option.click();

        await vi.waitFor(() => {
            expect(mockSetPageState).toHaveBeenCalledWith({
                ...pageState,
                mutations: ['S:E484K'],
            });
        });
    });

    it('allows multiple mutations to be entered', async ({ routeMockers: { lapis } }) => {
        setupLapisMocks(lapis);
        const mockSetPageState = vi.fn();

        const { getByRole } = render(
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <ManualAnalysisFilter pageState={defaultPageState} setPageState={mockSetPageState} />
            </gs-app>,
        );

        const mutationInput = getByRole('combobox');

        await mutationInput.fill('A23T');
        const option1 = await vi.waitFor(() => getByRole('option', { name: 'A23T', exact: true }));
        await option1.click();

        await mutationInput.fill('C241T');
        const option2 = await vi.waitFor(() => getByRole('option', { name: 'C241T', exact: true }));
        await option2.click();

        await vi.waitFor(() => {
            expect(mockSetPageState).toHaveBeenCalledWith({
                ...defaultPageState,
                mutations: ['A23T'],
            });
        });

        await vi.waitFor(() => {
            expect(mockSetPageState).toHaveBeenCalledWith({
                ...defaultPageState,
                mutations: ['A23T', 'C241T'],
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
}
