import React, { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { changeVariantQuery, getCurrentRouteInBrowser, navigateTo, type View1Route } from '../routing.ts';

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

const CollectionsListInner = () => {
    const [selectedCollectionIndex, setSelectedCollectionIndex] = useState(0);

    const query = useQuery({
        queryKey: [],
        queryFn: async () => {
            const response = await fetch('https://cov-spectrum.org/api/v2/resource/collection');
            return (await response.json()) as Collection[];
        },
    });

    if (!query.data) {
        return <></>;
    }

    return (
        <>
            <CollectionSelector
                collections={query.data}
                selectedIndex={selectedCollectionIndex}
                onSelect={setSelectedCollectionIndex}
            />
            <CollectionVariantList variants={query.data[selectedCollectionIndex].variants} />
        </>
    );
};

const queryClient = new QueryClient();
export const CollectionsList = () => (
    <QueryClientProvider client={queryClient}>
        <CollectionsListInner />
    </QueryClientProvider>
);

type CollectionSelectorProps = {
    collections: Collection[];
    selectedIndex: number;
    onSelect: (index: number) => void;
};

const CollectionSelector = ({ collections, selectedIndex, onSelect }: CollectionSelectorProps) => {
    return (
        <select
            className='w-full border'
            value={selectedIndex}
            onChange={(event) => onSelect(Number.parseInt(event.target.value, 10))}
        >
            {collections.map((collection, index) => (
                <option key={index} value={index}>
                    #{collection.id} {collection.title}
                </option>
            ))}
        </select>
    );
};

type CollectionVariantListProps = {
    variants: CollectionVariant[];
};

const CollectionVariantList = ({ variants }: CollectionVariantListProps) => {
    const selectVariant = (variant: CollectionVariant) => {
        const currentRoute = getCurrentRouteInBrowser()!;
        let newRoute: View1Route;
        const query = JSON.parse(variant.query);
        if ('variantQuery' in query) {
            newRoute = changeVariantQuery(currentRoute, {
                variantQuery: query.variantQuery,
            });
        } else {
            newRoute = changeVariantQuery(currentRoute, {
                nextcladePangoLineage: query.pangoLineage ?? query.nextcladePangoLineage,
                nucleotideMutations: query.nucMutations,
                aminoAcidMutations: query.aaMutations,
                nucleotideInsertions: query.nucInsertions,
                aminoAcidInsertions: query.aaInsertions,
            });
        }
        console.log('newRoute', JSON.stringify(newRoute, null, 4));
        navigateTo(newRoute);
    };

    return (
        <div className='flex flex-col'>
            {variants.map((variant) => (
                <button
                    key={variant.query}
                    className='border-b px-4 py-2 hover:bg-amber-200'
                    onClick={() => selectVariant(variant)}
                >
                    {variant.name}
                </button>
            ))}
        </div>
    );
};
