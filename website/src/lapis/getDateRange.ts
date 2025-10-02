import axios from 'axios';

import { getClientLogger } from '../clientLogger.ts';
import { aggregatedResponse } from './types.ts';

const logger = getClientLogger('getDateRange');

export async function getDateRange(baseUrl: string, fieldName: string): Promise<{ start: string; end: string }> {
    const url = `${baseUrl.replace(/\/$/, '')}/sample/aggregated`;
    const body = { fields: [fieldName], orderBy: [fieldName] };

    let response;
    try {
        response = await axios.post(url, body);
    } catch (error) {
        const message = `Failed to fetch date range: ${JSON.stringify(error)}`;
        logger.error(message);
        throw new Error(message);
    }

    const parsedResponse = aggregatedResponse.safeParse(response.data);
    if (!parsedResponse.success) {
        const message = `Failed to parse date range response: ${JSON.stringify(parsedResponse)} (was ${JSON.stringify(response.data)})`;
        logger.error(message);
        throw new Error(message);
    }

    if (!parsedResponse.data.data.length) throw new Error('No data returned');

    const startRaw = parsedResponse.data.data[0][fieldName];
    const endRaw = parsedResponse.data.data[parsedResponse.data.data.length - 1][fieldName];

    if (typeof startRaw !== 'string' || typeof endRaw !== 'string') {
        throw new Error(`Expected ${fieldName} to be string, got ${typeof startRaw} / ${typeof endRaw}`);
    }

    return { start: startRaw, end: endRaw };
}
