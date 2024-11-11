import axios from 'axios';
import dayjs from 'dayjs';
import { z } from 'zod';

import { getInstanceLogger } from '../logger.ts';

const lapisInfoSchema = z.object({
    dataVersion: z.string(),
});
export type LapisInfo = z.infer<typeof lapisInfoSchema>;

const logger = getInstanceLogger('getLastUpdatedDate');

export async function getLastUpdatedDate(lapisUrl: string) {
    try {
        const response = await axios.get(`${lapisUrl}/sample/info`);
        const parsedLapisInfo = lapisInfoSchema.safeParse(response.data);

        if (parsedLapisInfo.success) {
            const timestamp = Number(parsedLapisInfo.data.dataVersion);
            if (isNaN(timestamp)) {
                logger.error(`Got invalid timestamp from lapis info: '${parsedLapisInfo.data.dataVersion}'`);
                return undefined;
            }
            return dayjs.unix(timestamp).locale('de').calendar(null, { sameElse: '[on] YYYY-MM-DD' });
        }

        logger.error(
            `Failed to parse lapis info: ${JSON.stringify(parsedLapisInfo)} (was ${JSON.stringify(response.data)})`,
        );
        return undefined;
    } catch (error) {
        logger.error(`Failed to fetch lapis info: ${JSON.stringify(error)}`);
        return undefined;
    }
}
