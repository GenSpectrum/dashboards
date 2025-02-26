import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { z } from 'zod';

import { getClientLogger } from '../../../clientLogger.ts';
import type { OrganismsConfig } from '../../../config.ts';
import { type CovidVariantData } from '../../../views/covid.ts';
import { Routing } from '../../../views/routing.ts';
import { useErrorToast } from '../../ErrorReportInstruction.tsx';
import { withQueryProvider } from '../../subscriptions/backendApi/withQueryProvider.tsx';

export const collectionVariantClassName = 'border bg-white px-4 py-2 hover:bg-cyan';

type CollectionVariant = {
    name: string;
    query: string;
    description: string;
};

type Collection = {
    id: number;
    title: string;
    variants: CollectionVariant[];
};

type CollectionsListProps = {
    initialCollectionId?: number;
    organismsConfig: OrganismsConfig;
};

export const CollectionsList = withQueryProvider(CollectionsListInner);

function CollectionsListInner({ initialCollectionId, organismsConfig }: CollectionsListProps) {
    const [selectedCollectionId, setSelectedCollectionId] = useState(initialCollectionId ?? 1);

    const query = useQuery({
        queryKey: [],
        queryFn: async () => {
            const response = await fetch('https://cov-spectrum.org/api/v2/resource/collection');
            const collections = (await response.json()) as Collection[];
            collections.sort((c1, c2) => c1.id - c2.id);
            return collections;
        },
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
                organismsConfig={organismsConfig}
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
            className='mb-2 w-full border bg-white p-2'
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
    organismsConfig: OrganismsConfig;
};

function CollectionVariantList({ collection, organismsConfig }: CollectionVariantListProps) {
    const variants = collection.variants;

    return (
        <div className='flex flex-col'>
            {variants.map((variant, index) => (
                <VariantLink
                    key={`${variant.name}_${variant.query}_${index}`}
                    variant={variant}
                    organismsConfig={organismsConfig}
                    collectionId={collection.id}
                />
            ))}
        </div>
    );
}

type VariantLinkProps = {
    variant: CollectionVariant;
    organismsConfig: OrganismsConfig;
    collectionId: number;
};

function VariantLink({ variant, organismsConfig, collectionId }: VariantLinkProps) {
    const variantLink = useVariantLink(organismsConfig, collectionId, variant);

    return (
        <a className={collectionVariantClassName} href={variantLink}>
            {variant.name}
        </a>
    );
}

const logger = getClientLogger('CollectionList');

function useVariantLink(organismsConfig: OrganismsConfig, collectionId: number, variant: CollectionVariant) {
    const routing = useMemo(() => new Routing(organismsConfig), [organismsConfig]);

    const { showErrorToast } = useErrorToast(logger);

    const currentPageState = routing
        .getOrganismView('covid.singleVariantView')
        .pageStateHandler.parsePageStateFromUrl(new URL(window.location.href));
    let newPageState: CovidVariantData;

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
        newPageState = {
            ...currentPageState,
            collectionId: collectionId,
            variantFilter: {
                lineages: {},
                mutations: {},
                variantQuery: query.variantQuery,
            },
        };
    } else {
        newPageState = {
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
    return routing.getOrganismView('covid.singleVariantView').pageStateHandler.toUrl(newPageState);
}
