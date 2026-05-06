import type { LapisFilter } from '@genspectrum/dashboard-components/util';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { withQueryProvider } from '../../../backendApi/withQueryProvider.tsx';
import { getTotalCount } from '../../../lapis/getTotalCount.ts';
import { PageHeadline } from '../../../styles/containers/PageHeadline.tsx';
import {
    FILTER_OBJECT_ARRAY_FIELD_LABELS,
    getLineageFields,
    getVariantFilter,
    type Collection,
    type FilterObject,
    type Variant,
} from '../../../types/Collection.ts';
import { organismConfig, type Organism } from '../../../types/Organism.ts';
import { Page } from '../../../types/pages.ts';

type LapisConfig = {
    url: string;
    mainDateField: string;
    additionalFilters?: Record<string, string>;
};

function CollectionDetailInner({
    organism,
    collection,
    lapisConfig,
    isOwner,
    ownerName,
}: {
    organism: Organism;
    collection: Collection;
    lapisConfig: LapisConfig;
    isOwner: boolean;
    ownerName: string;
}) {
    const organismName = organismConfig[organism].label;
    const dateFrom30 = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
    const dateFrom90 = dayjs().subtract(90, 'day').format('YYYY-MM-DD');

    return (
        <div className='flex flex-col gap-4'>
            <div>
                <div className='flex items-start justify-between gap-4'>
                    <PageHeadline>
                        <span className='mr-2 font-normal text-gray-400'>#{collection.id}</span>
                        {collection.name}
                    </PageHeadline>
                    {isOwner && (
                        <a
                            href={Page.editCollection(organism, String(collection.id))}
                            className='btn btn-sm mt-1 shrink-0'
                        >
                            Edit
                        </a>
                    )}
                </div>
                {collection.description !== null && <p className='mt-1 text-gray-500'>{collection.description}</p>}
                <p className='mt-1 text-sm text-gray-500'>
                    {organismName} collection owned by {ownerName}
                </p>
            </div>

            <div>
                <h2 className='mb-3 text-lg font-semibold'>Variants ({collection.variants.length})</h2>
                {collection.variants.length === 0 ? (
                    <p className='text-sm text-gray-500'>No variants defined.</p>
                ) : (
                    <table className='w-full border-collapse text-sm'>
                        <thead>
                            <tr className='border-b border-gray-200 text-left text-gray-500'>
                                <th className='pr-4 pb-2 font-medium'>Name</th>
                                <th className='pr-4 pb-2 font-medium'>Description</th>
                                <th className='pr-4 pb-2 font-medium'>Query</th>
                                <th className='pr-4 pb-2 text-right font-medium'>Total</th>
                                <th className='pr-4 pb-2 text-right font-medium'>Last 30d</th>
                                <th className='pb-2 text-right font-medium'>Last 90d</th>
                            </tr>
                        </thead>
                        <tbody>
                            {collection.variants.map((variant) => (
                                <VariantRow
                                    key={variant.id}
                                    variant={variant}
                                    organism={organism}
                                    lapisConfig={lapisConfig}
                                    dateFrom30={dateFrom30}
                                    dateFrom90={dateFrom90}
                                />
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export const CollectionDetail = withQueryProvider(CollectionDetailInner);

function VariantRow({
    variant,
    organism,
    lapisConfig,
    dateFrom30,
    dateFrom90,
}: {
    variant: Variant;
    organism: Organism;
    lapisConfig: LapisConfig;
    dateFrom30: string;
    dateFrom90: string;
}) {
    const { url: lapisUrl, mainDateField, additionalFilters } = lapisConfig;
    const variantFilter = getVariantFilter(variant);

    const totalQuery = useQuery({
        queryKey: ['variantCount', lapisUrl, variant.id, 'total'],
        queryFn: () => getTotalCount(lapisUrl, { ...additionalFilters, ...variantFilter } as LapisFilter),
    });

    const last30Query = useQuery({
        queryKey: ['variantCount', lapisUrl, variant.id, '30d', dateFrom30],
        queryFn: () =>
            getTotalCount(lapisUrl, {
                ...additionalFilters,
                ...variantFilter,
                [`${mainDateField}From`]: dateFrom30,
            } as LapisFilter),
    });

    const last90Query = useQuery({
        queryKey: ['variantCount', lapisUrl, variant.id, '90d', dateFrom90],
        queryFn: () =>
            getTotalCount(lapisUrl, {
                ...additionalFilters,
                ...variantFilter,
                [`${mainDateField}From`]: dateFrom90,
            } as LapisFilter),
    });

    const queryDisplay =
        variant.type === 'query' ? (
            <span className='font-mono text-xs'>{variant.countQuery}</span>
        ) : (
            <span className='text-xs'>{formatFilterObjectQuery(variant.filterObject)}</span>
        );

    return (
        <tr className='border-b border-gray-100 last:border-0'>
            <td className='py-2 pr-4 font-medium'>
                <a className='underline' href={Page.singleVariantView(organism, variant)} title='Analyze this variant'>
                    {variant.name}
                </a>
            </td>
            <td className='py-2 pr-4 text-sm text-gray-500'>{variant.description ?? '—'}</td>
            <td className='py-2 pr-4'>{queryDisplay}</td>
            <CountCell {...totalQuery} />
            <CountCell {...last30Query} />
            <CountCell {...last90Query} />
        </tr>
    );
}

function CountCell({ isPending, isError, data }: { isPending: boolean; isError: boolean; data?: number }) {
    if (isPending) return <td className='px-4 py-2 text-right text-gray-400'>…</td>;
    if (isError) return <td className='text-error px-4 py-2 text-right'>Count unavailable</td>;
    return <td className='px-4 py-2 text-right tabular-nums'>{data?.toLocaleString()}</td>;
}

function formatFilterObjectQuery(filterObject: FilterObject): string {
    const lineageFields = getLineageFields(filterObject);
    const parts: string[] = [];

    for (const [key, val] of lineageFields) {
        parts.push(`${key}: ${val}`);
    }

    const arrayFields = Object.keys(
        FILTER_OBJECT_ARRAY_FIELD_LABELS,
    ) as (keyof typeof FILTER_OBJECT_ARRAY_FIELD_LABELS)[];
    for (const field of arrayFields) {
        const values = filterObject[field];
        if (values && values.length > 0) {
            parts.push(values.join(', '));
        }
    }

    return parts.join(' · ') || '—';
}
