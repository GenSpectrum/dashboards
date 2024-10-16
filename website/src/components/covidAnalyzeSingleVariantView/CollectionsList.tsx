import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import type { OrganismsConfig } from '../../config.ts';
import { type CovidAnalyzeSingleVariantRoute } from '../../routes/covid.ts';
import { Routing } from '../../routes/routing.ts';
import { withQueryProvider } from '../subscriptions/backendApi/withQueryProvider.tsx';

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

type CollectionVariantListProps = {
    collection: Collection;
    organismsConfig: OrganismsConfig;
};

function CollectionVariantList({ collection, organismsConfig }: CollectionVariantListProps) {
    const variants = collection.variants;

    const routing = useMemo(() => new Routing(organismsConfig), [organismsConfig]);

    const selectVariant = (variant: CollectionVariant) => {
        const currentRoute = routing.getCurrentRouteInBrowser() as CovidAnalyzeSingleVariantRoute;
        let newRoute: CovidAnalyzeSingleVariantRoute;
        const query = JSON.parse(variant.query);
        if ('variantQuery' in query) {
            newRoute = {
                ...currentRoute,
                collectionId: collection.id,
                variantFilter: {
                    variantQuery: query.variantQuery,
                },
            };
        } else {
            newRoute = {
                ...currentRoute,
                collectionId: collection.id,
                variantFilter: {
                    lineage: query.pangoLineage ?? query.nextcladePangoLineage,
                    nucleotideMutations: query.nucMutations,
                    aminoAcidMutations: query.aaMutations,
                    nucleotideInsertions: query.nucInsertions,
                    aminoAcidInsertions: query.aaInsertions,
                },
            };
        }
        routing.navigateTo(newRoute);
    };

    return (
        <div className='flex flex-col'>
            {variants.map((variant, index) => (
                <button
                    key={`${variant.name}_${variant.query}_${index}`}
                    className='border bg-white px-4 py-2 hover:bg-amber-200'
                    onClick={() => selectVariant(variant)}
                >
                    {variant.name}
                </button>
            ))}
        </div>
    );
}
