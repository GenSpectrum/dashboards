import type { LapisFilter } from '@genspectrum/dashboard-components/util';
import axios from 'axios';
import { z } from 'zod';

import { getClientLogger } from '../clientLogger.ts';

const lapisTotalCountSchema = z.object({
    data: z.tuple([z.object({ count: z.number() })]),
});
export type LapisTotalCount = z.infer<typeof lapisTotalCountSchema>;

const logger = getClientLogger('getTotalCount');

export async function getTotalCount(lapisUrl: string, lapisFilter: LapisFilter) {
    let response;
    try {
        response = await axios.post(`${lapisUrl}/sample/aggregated`, lapisFilter);
    } catch (error) {
        const message = `Failed to fetch lapis aggregated data: ${JSON.stringify(error)}`;
        logger.error(message);
        throw new Error(message);
    }

    const parsedResponse = lapisTotalCountSchema.safeParse(response.data);
    if (parsedResponse.success) {
        return parsedResponse.data.data[0].count;
    }

    const message = `Failed to parse lapis aggregated data: ${JSON.stringify(parsedResponse)} (was ${JSON.stringify(response.data)})`;
    logger.error(message);
    throw new Error(message);
}
