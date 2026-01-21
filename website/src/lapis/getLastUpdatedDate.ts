import axios from 'axios';
import dayjs from 'dayjs';
import { z } from 'zod';

import { getClientLogger } from '../clientLogger.ts';
import setupDayjs from '../util/setupDayjs.ts';

const lapisInfoSchema = z.object({
    dataVersion: z.string(),
});
export type LapisInfo = z.infer<typeof lapisInfoSchema>;

const logger = getClientLogger('getLastUpdatedDate');

setupDayjs();

export async function getLastUpdatedDate(lapisUrl: string) {
    let response;
    try {
        response = await axios.get(`${lapisUrl}/sample/info`);
    } catch (error) {
        logger.error(`Failed to fetch lapis info: ${(error as Error).toString()}`);
        return null;
    }

    const parsedLapisInfo = lapisInfoSchema.safeParse(response.data);

    if (parsedLapisInfo.success) {
        const timestamp = Number(parsedLapisInfo.data.dataVersion);
        if (isNaN(timestamp)) {
            logger.error(`Got invalid timestamp from lapis info: '${parsedLapisInfo.data.dataVersion}'`);
            return null;
        }
        return dayjs.unix(timestamp).locale('de').calendar(null, { sameElse: '[on] YYYY-MM-DD' });
    }

    logger.error(
        `Failed to parse lapis info: ${JSON.stringify(parsedLapisInfo)} (was ${JSON.stringify(response.data)})`,
    );
    return null;
}
