import { type UseQueryResult } from '@tanstack/react-query';
import { page, userEvent } from '@vitest/browser/context';
import { describe, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { VariantExplorerFilter } from './VariantExplorerFilter';
import { DUMMY_LAPIS_URL, type LapisRouteMocker } from '../../../../../routeMocker';
import { it } from '../../../../../test-extend';
import type { CollectionSummary } from '../../../../types/Collection';
import type { WasapVariantFilter } from '../../../views/wasap/wasapPageConfig';

const DUMMY_LAPIS_URL_2 = 'http://lapis2.dummy';

const DUMMY_COLLECTIONS: CollectionSummary[] = [
    { id: 1, name: 'XBB.1.5', ownedBy: 1, organism: 'SARS-CoV-2', description: null, variantCount: 5 },
    { id: 2, name: 'JN.1', ownedBy: 1, organism: 'SARS-CoV-2', description: null, variantCount: 3 },
];
const mockPredefinedQueryResult = { data: DUMMY_COLLECTIONS } as unknown as UseQueryResult<CollectionSummary[]>;

describe('VariantExplorerFilter', () => {
    const defaultPageState: WasapVariantFilter = {
        mode: 'variant',
        signatureType: 'computed',
        sequenceType: 'nucleotide',
        variant: undefined,
        minProportion: 0.05,
        minCount: 10,
        minJaccard: 0.5,
        timeFrame: 'all',
    };

    const predefinedPageState: WasapVariantFilter = {
        ...defaultPageState,
        signatureType: 'predefined',
    };

    it('calls setPageState when changing sequence type', async ({ routeMockers: { lapis } }) => {
        setupLapisMocks(lapis);
        const mockSetPageState = vi.fn();

        const { getByLabelText } = render(
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <VariantExplorerFilter
                    pageState={defaultPageState}
                    setPageState={mockSetPageState}
                    clinicalSequenceLapisBaseUrl={DUMMY_LAPIS_URL_2}
                    clinicalSequenceLapisLineageField='pangoLineage'
                />
            </gs-app>,
        );

        const aminoAcidRadio = getByLabelText('Amino acid');
        await aminoAcidRadio.click();

        expect(mockSetPageState).toHaveBeenCalledWith({
            ...defaultPageState,
            sequenceType: 'amino acid',
        });
    });

    it('allows selecting a variant from the lineage selector', async ({ routeMockers: { lapis } }) => {
        setupLapisMocks(lapis);
        const mockSetPageState = vi.fn();

        const { getByRole } = render(
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <VariantExplorerFilter
                    pageState={defaultPageState}
                    setPageState={mockSetPageState}
                    clinicalSequenceLapisBaseUrl={DUMMY_LAPIS_URL_2}
                    clinicalSequenceLapisLineageField='pangoLineage'
                />
            </gs-app>,
        );

        const variantCombobox = await vi.waitFor(() => getByRole('combobox', { name: /variant/i }));

        await userEvent.click(variantCombobox);
        await userEvent.type(variantCombobox, 'JN.1');

        const option = await vi.waitFor(() => getByRole('option', { name: 'JN.1', exact: true }));
        await option.click();

        await vi.waitFor(() => {
            expect(mockSetPageState).toHaveBeenCalledWith({
                ...defaultPageState,
                variant: 'JN.1',
            });
        });
    });

    it('calls setPageState when changing min proportion', async ({ routeMockers: { lapis } }) => {
        setupLapisMocks(lapis);
        const mockSetPageState = vi.fn();

        const { getByRole } = render(
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <VariantExplorerFilter
                    pageState={defaultPageState}
                    setPageState={mockSetPageState}
                    clinicalSequenceLapisBaseUrl={DUMMY_LAPIS_URL_2}
                    clinicalSequenceLapisLineageField='pangoLineage'
                />
            </gs-app>,
        );

        const minProportionInput = getByRole('spinbutton').first();
        await minProportionInput.fill('0.1');

        expect(mockSetPageState).toHaveBeenCalledWith({
            ...defaultPageState,
            minProportion: 0.1,
        });
    });

    it('calls setPageState when switching to predefined signature type', async ({ routeMockers: { lapis } }) => {
        setupLapisMocks(lapis);
        const mockSetPageState = vi.fn();

        render(
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <VariantExplorerFilter
                    pageState={defaultPageState}
                    setPageState={mockSetPageState}
                    clinicalSequenceLapisBaseUrl={DUMMY_LAPIS_URL_2}
                    clinicalSequenceLapisLineageField='pangoLineage'
                    predefinedVariantsQueryResult={mockPredefinedQueryResult}
                />
            </gs-app>,
        );

        const variantSourceSelect = page.getByRole('combobox').first();
        await variantSourceSelect.selectOptions('predefined');

        expect(mockSetPageState).toHaveBeenCalledWith({
            ...defaultPageState,
            signatureType: 'predefined',
        });
    });

    it('calls setPageState when selecting a predefined collection', async ({ routeMockers: { lapis } }) => {
        setupLapisMocks(lapis);
        const mockSetPageState = vi.fn();

        const { getByRole } = render(
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <VariantExplorerFilter
                    pageState={predefinedPageState}
                    setPageState={mockSetPageState}
                    clinicalSequenceLapisBaseUrl={DUMMY_LAPIS_URL_2}
                    clinicalSequenceLapisLineageField='pangoLineage'
                    predefinedVariantsQueryResult={mockPredefinedQueryResult}
                />
            </gs-app>,
        );

        const collectionInput = page.getByPlaceholder('Select variant');
        await collectionInput.click();
        await userEvent.type(collectionInput, 'XBB');

        const option = await vi.waitFor(() => getByRole('option', { name: 'XBB.1.5', exact: true }));
        await option.click();

        await vi.waitFor(() => {
            expect(mockSetPageState).toHaveBeenCalledWith({
                ...predefinedPageState,
                collectionId: 1,
            });
        });
    });

    it('calls setPageState when toggling "Mutation not in parent"', async ({ routeMockers: { lapis } }) => {
        setupLapisMocks(lapis);
        const mockSetPageState = vi.fn();

        const { getByLabelText } = render(
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <VariantExplorerFilter
                    pageState={predefinedPageState}
                    setPageState={mockSetPageState}
                    clinicalSequenceLapisBaseUrl={DUMMY_LAPIS_URL_2}
                    clinicalSequenceLapisLineageField='pangoLineage'
                    predefinedVariantsQueryResult={mockPredefinedQueryResult}
                />
            </gs-app>,
        );

        const checkbox = getByLabelText('Mutation not in parent');
        await checkbox.click();

        expect(mockSetPageState).toHaveBeenCalledWith({
            ...predefinedPageState,
            newMutationsOnly: true,
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
