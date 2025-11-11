import { getClientLogger } from '../clientLogger.ts';
import { getTotalCount } from './getTotalCount';

const logger = getClientLogger('checkLapisHealth');

export async function checkLapisHealth(lapisUrl: string): Promise<boolean> {
    try {
        await getTotalCount(lapisUrl, {});
        return true;
    } catch (error) {
        logger.error(`LAPIS health check failed: ${JSON.stringify(error)}`);
        return false;
    }
}
