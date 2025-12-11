import type { LapisFilter, SequenceType } from '@genspectrum/dashboard-components/util';
import axios from 'axios';
import { z } from 'zod';

import { getClientLogger } from '../clientLogger.ts';
import { getTotalCount } from './getTotalCount.ts';

const mutationsSchema = z.object({
    data: z.array(
        z.object({
            mutation: z.string(),
            count: z.number(),
        }),
    ),
});

const logger = getClientLogger('getMutations');

/**
 * Return nucleotide or amino acid mutations matching certain filter criteria.
 * The underlying request is POST request, but this is still semantically a 'get' operation, hence the name.
 *
 * @param lapisUrl The base API URL
 * @param mutationType nucleotide or amino acid sequences
 * @param lapisFilter only return mutations from sequences matching the filter
 * @param minProportion The relative frequency a mutation needs to have, relative to the total number of
 *      unambiguous reads (matching the given other filters)
 * @param minCount The minimum absolute count a mutation needs to have (after filters are applied) to
 *      be included in the result
 * @returns A list of mutation codes
 */
export async function getMutations(
    lapisUrl: string,
    mutationType: SequenceType,
    lapisFilter: LapisFilter | undefined,
    minProportion: number,
    minCount: number,
): Promise<string[]> {
    return getMutationsInternal(lapisUrl, mutationType, lapisFilter, minProportion).then((data) =>
        data.filter((item) => item.count >= minCount).map((item) => item.mutation),
    );
}

/**
 * Returns the list of mutations that are defining this variant, based on the given parameters.
 * The result also includes the Jaccard index for every mutation.
 *
 * @param lineageFilter a `LapisFilter` that filters for a particular lineage.
 */
export async function getMutationsForVariant(
    lapisUrl: string,
    mutationType: SequenceType,
    lineageFilter: LapisFilter,
    minProportion: number,
    minCount: number,
    minJaccardIndex: number,
    dateFilter: LapisFilter | undefined,
) {
    return Promise.all([
        // sequence counts WITH mutation and WITH lineage
        getMutationsInternal(lapisUrl, mutationType, { ...lineageFilter, ...dateFilter }, minProportion).then((r) =>
            r.filter((item) => item.count >= minCount),
        ),
        // sequence counts WITH mutation (only)
        getMutationsInternal(lapisUrl, mutationType, dateFilter, 0).then((r) =>
            Object.fromEntries(r.map((item) => [item.mutation, item.count])),
        ),
        // sequence count WITH lineage (only)
        getTotalCount(lapisUrl, { ...lineageFilter, ...dateFilter }),
    ]).then(([intersectionCounts, totalCounts, variantCount]) =>
        intersectionCounts
            .map(({ mutation, count }) => ({
                mutation,
                // Formula: https://en.wikipedia.org/wiki/Jaccard_index#Overview
                jaccardIndex: count / (variantCount + totalCounts[mutation] - count),
            }))
            .filter(({ jaccardIndex }) => jaccardIndex >= minJaccardIndex),
    );
}

async function getMutationsInternal(
    lapisUrl: string,
    mutationType: SequenceType,
    lapisFilter: LapisFilter | undefined,
    minProportion: number | undefined,
): Promise<{ mutation: string; count: number }[]> {
    const endpoint = mutationType === 'nucleotide' ? 'nucleotideMutations' : 'aminoAcidMutations';
    const url = `${lapisUrl.replace(/\/$/, '')}/sample/${endpoint}`;

    const body: Record<string, unknown> = {};
    Object.assign(body, lapisFilter);
    if (minProportion !== undefined) {
        body.minProportion = minProportion;
    }

    let response;
    try {
        response = await axios.post(url, body);
    } catch (error) {
        const message = `Failed to fetch mutations: ${JSON.stringify(error)}`;
        logger.error(message);
        throw new Error(message);
    }

    const parsedResponse = mutationsSchema.safeParse(response.data);
    if (!parsedResponse.success) {
        const message = `Failed to parse mutations response: ${JSON.stringify(parsedResponse)} (was ${JSON.stringify(response.data)})`;
        logger.error(message);
        throw new Error(message);
    }

    return parsedResponse.data.data;
}
