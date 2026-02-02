import axios from 'axios';

import { getClientLogger } from '../clientLogger.ts';
import { collectionsRawResponseSchema, type CollectionRaw } from './types.ts';

const logger = getClientLogger('getCollections');

/**
 * Fetches the list of variant collections from the CoV-Spectrum API.
 * Collections are returned sorted by ID in ascending order.
 *
 * @param covSpectrumApiBaseUrl The base URL of the CoV-Spectrum API (e.g., 'https://cov-spectrum.org/api/v2')
 * @returns A promise that resolves to an array of Collection objects
 * @throws Error if the request fails or response validation fails
 */
export async function getCollections(covSpectrumApiBaseUrl: string): Promise<CollectionRaw[]> {
    const url = `${covSpectrumApiBaseUrl}/resource/collection`;

    let response;
    try {
        response = await axios.get(url);
    } catch (error) {
        const message = `Failed to fetch collections: ${JSON.stringify(error)}`;
        logger.error(message);
        throw new Error(message);
    }

    const parsedResponse = collectionsRawResponseSchema.safeParse(response.data);
    if (parsedResponse.success) {
        // Sort by ID to ensure consistent ordering
        const sorted = parsedResponse.data.sort((c1, c2) => c1.id - c2.id);
        return sorted;
    }

    // TODO - in here we don't do the same parsing as in getCollection (parsing the query) - we might want to do that

    const message = `Failed to parse collections response: ${JSON.stringify(parsedResponse.error)} (was ${JSON.stringify(response.data)})`;
    logger.error(message);
    throw new Error(message);
}
