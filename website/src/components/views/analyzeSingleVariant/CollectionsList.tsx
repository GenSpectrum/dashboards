import { useQuery } from '@tanstack/react-query';
import { type Dispatch, type SetStateAction, useState } from 'react';
import { z } from 'zod';

import { getClientLogger } from '../../../clientLogger.ts';
import { getCollections, type Collection, type CollectionVariant } from '../../../covspectrum/getCollections.ts';
import { type CovidVariantData } from '../../../views/covid.ts';
import { useErrorToast } from '../../ErrorReportInstruction.tsx';

export const collectionVariantClassName = 'border bg-white px-4 py-2 hover:bg-cyan border-gray-200 cursor-pointer';

type CollectionsListProps = {
    initialCollectionId?: number;
    pageState: CovidVariantData;
    setPageState: Dispatch<SetStateAction<CovidVariantData>>;
};

export function CollectionsList({ initialCollectionId, pageState, setPageState }: CollectionsListProps) {
    const [selectedCollectionId, setSelectedCollectionId] = useState(initialCollectionId ?? 1);

    const covSpectrumApiBaseUrl = 'https://cov-spectrum.org/api/v2';
    const query = useQuery({
        queryKey: ['collections', covSpectrumApiBaseUrl],
        queryFn: async () => getCollections(covSpectrumApiBaseUrl),
    });

    if (!query.data) {
        return null;
    }

    return (
        <>
            <CollectionSelector
                collections={query.data}
                selectedId={selectedCollectionId}
                onSelect={setSelectedCollectionId}
            />
            <CollectionVariantList
                collection={query.data.find((c) => c.id === selectedCollectionId) ?? query.data[0]}
                pageState={pageState}
                setPageState={setPageState}
            />
        </>
    );
}

type CollectionSelectorProps = {
    collections: Collection[];
    selectedId: number;
    onSelect: (index: number) => void;
};

function CollectionSelector({ collections, selectedId, onSelect }: CollectionSelectorProps) {
    return (
        <select
            className='select mb-2 w-full'
            value={selectedId}
            onChange={(event) => onSelect(Number.parseInt(event.target.value, 10))}
        >
            {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                    #{collection.id} {collection.title}
                </option>
            ))}
        </select>
    );
}

const querySchema = z.object({
    pangoLineage: z.string().optional(),
    nextcladePangoLineage: z.string().optional(),
    nucMutations: z.array(z.string()).optional(),
    aaMutations: z.array(z.string()).optional(),
    nucInsertions: z.array(z.string()).optional(),
    aaInsertions: z.array(z.string()).optional(),
    variantQuery: z.string().optional(),
});

type CollectionVariantListProps = {
    collection: Collection;
    pageState: CovidVariantData;
    setPageState: Dispatch<SetStateAction<CovidVariantData>>;
};

function CollectionVariantList({ collection, pageState, setPageState }: CollectionVariantListProps) {
    const variants = collection.variants;

    return (
        <div className='flex flex-col'>
            {variants.map((variant, index) => (
                <VariantLink
                    key={`${variant.name}_${variant.query}_${index}`}
                    variant={variant}
                    collectionId={collection.id}
                    pageState={pageState}
                    setPageState={setPageState}
                />
            ))}
        </div>
    );
}

type VariantLinkProps = {
    variant: CollectionVariant;
    collectionId: number;
    pageState: CovidVariantData;
    setPageState: Dispatch<SetStateAction<CovidVariantData>>;
};

function VariantLink({ variant, collectionId, pageState, setPageState }: VariantLinkProps) {
    const newPageState = useVariantLinkPageState(pageState, collectionId, variant);

    const applyFilters = () => {
        if (newPageState === undefined) {
            return;
        }
        setPageState(newPageState);
    };

    return (
        <button type='button' className={collectionVariantClassName} onClick={applyFilters}>
            {variant.name}
        </button>
    );
}

const logger = getClientLogger('CollectionList');

function useVariantLinkPageState(
    currentPageState: CovidVariantData,
    collectionId: number,
    variant: CollectionVariant,
): CovidVariantData | undefined {
    const { showErrorToast } = useErrorToast(logger);

    const queryParseResult = querySchema.safeParse(JSON.parse(variant.query));

    if (!queryParseResult.success) {
        showErrorToast({
            error: queryParseResult.error,
            logMessage: `Failed to parse query of variant ${variant.name} of collection ${collectionId}: ${queryParseResult.error.message}`,
            errorToastMessages: [`The variant filter of the collection variant "${variant.name}" seems to be invalid.`],
        });
        return;
    }

    const query = queryParseResult.data;

    if (query.variantQuery !== undefined) {
        return {
            ...currentPageState,
            collectionId: collectionId,
            variantFilter: {
                lineages: {},
                mutations: {},
                variantQuery: query.variantQuery,
            },
        };
    } else {
        return {
            ...currentPageState,
            collectionId: collectionId,
            variantFilter: {
                lineages: {
                    nextcladePangoLineage: query.pangoLineage ?? query.nextcladePangoLineage,
                },
                mutations: {
                    nucleotideMutations: query.nucMutations,
                    aminoAcidMutations: query.aaMutations,
                    nucleotideInsertions: query.nucInsertions,
                    aminoAcidInsertions: query.aaInsertions,
                },
            },
        };
    }
}
