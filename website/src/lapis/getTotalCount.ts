import type { LapisFilter } from '@genspectrum/dashboard-components/util';
import axios from 'axios';
import { z } from 'zod';

import { getInstanceLogger } from '../logger.ts';

const lapisTotalCountSchema = z.object({
    data: z.tuple([z.object({ count: z.number() })]),
});
export type LapisTotalCount = z.infer<typeof lapisTotalCountSchema>;

const logger = getInstanceLogger('getTotalCount');

export async function getTotalCount(lapisUrl: string, lapisFilter: LapisFilter) {
    try {
        const response = await axios.post(`${lapisUrl}/sample/aggregated`, lapisFilter);
        const parsedResponse = lapisTotalCountSchema.safeParse(response.data);

        if (parsedResponse.success) {
            return parsedResponse.data.data[0].count;
        }

        logger.error(
            `Failed to parse lapis aggregated data: ${JSON.stringify(parsedResponse)} (was ${JSON.stringify(response.data)})`,
        );
        return undefined;
    } catch (error) {
        logger.error(`Failed to fetch lapis aggregated data: ${JSON.stringify(error)}`);
        return undefined;
    }
}
