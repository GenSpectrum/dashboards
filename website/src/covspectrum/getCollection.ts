import axios from 'axios';

import { getClientLogger } from '../clientLogger.ts';
import { collectionRawSchema, collectionVariantSchema, type Collection, type CollectionVariant } from './types.ts';

const logger = getClientLogger('getCollection');

/**
 * Fetches a single variant collection by ID from the CoV-Spectrum API.
 *
 * @param covSpectrumApiBaseUrl The base URL of the CoV-Spectrum API (e.g., 'https://cov-spectrum.org/api/v2')
 * @param id The ID of the collection to fetch
 * @returns A promise that resolves to a Collection object
 * @throws Error if the request fails or response validation fails
 */
export async function getCollection(covSpectrumApiBaseUrl: string, id: number): Promise<Collection> {
    const url = `${covSpectrumApiBaseUrl}/resource/collection/${id}`;

    let response;
    try {
        response = await axios.get(url);
    } catch (error) {
        const message = `Failed to fetch collection ${id}: ${JSON.stringify(error)}`;
        logger.error(message);
        throw new Error(message);
    }

    const parsedResponse = collectionRawSchema.safeParse(response.data);
    if (!parsedResponse.success) {
        const message = `Failed to parse collection ${id} response: ${JSON.stringify(parsedResponse.error)} (was ${JSON.stringify(response.data)})`;
        logger.error(message);
        throw new Error(message);
    }

    // Parse the query field in each variant from JSON string to object
    const rawCollection = parsedResponse.data;
    const parsedVariants: CollectionVariant[] = [];

    for (const variant of rawCollection.variants) {
        let parsedQuery;
        try {
            parsedQuery = JSON.parse(variant.query);
        } catch (error) {
            const message = `Failed to parse query JSON for variant "${variant.name}" in collection ${id}: ${error}`;
            logger.error(message);
            throw new Error(message);
        }

        // Add type discriminator based on the shape of the parsed query
        const queryWithType =
            'variantQuery' in parsedQuery
                ? { type: 'variantQuery' as const, ...parsedQuery }
                : { type: 'detailedMutations' as const, ...parsedQuery };

        const variantValidation = collectionVariantSchema.safeParse({
            ...variant,
            query: queryWithType,
        });

        if (!variantValidation.success) {
            const message = `Failed to validate parsed variant "${variant.name}" in collection ${id}: ${JSON.stringify(variantValidation.error)}`;
            logger.error(message);
            throw new Error(message);
        }

        parsedVariants.push(variantValidation.data);
    }

    return {
        ...rawCollection,
        variants: parsedVariants,
    };
}
