import { type SequenceType } from '@genspectrum/dashboard-components/util';
import axios from 'axios';
import { z } from 'zod';

import { getClientLogger } from '../clientLogger.ts';

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
 * @param pangoLineage Filter only for sequences belonging to this lineage
 * @param minProportion The relative frequency a mutation needs to have, relative to the total number of
 *      unambiguous reads (matching the given other filters)
 * @param minCount The minimum absolute count a mutation needs to have (after filters are applied) to
 *      be included in the result
 * @returns A list of mutation codes
 */
export async function getMutations(
    lapisUrl: string,
    mutationType: SequenceType,
    pangoLineage: string | undefined,
    minProportion: number,
    minCount: number,
): Promise<string[]> {
    const endpoint = mutationType === 'nucleotide' ? 'nucleotideMutations' : 'aminoAcidMutations';
    const url = `${lapisUrl.replace(/\/$/, '')}/sample/${endpoint}`;

    const body: Record<string, unknown> = { minProportion };
    if (pangoLineage !== undefined) {
        body.pangoLineage = pangoLineage;
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

    return parsedResponse.data.data.filter((item) => item.count >= minCount).map((item) => item.mutation);
}
