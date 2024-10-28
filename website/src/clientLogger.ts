import axios, { isAxiosError } from 'axios';

import { type InstanceLogger, type LogMessage } from './types/logMessage.ts';

class ClientLogger {
    public sendLogMessage = async (logMessage: LogMessage): Promise<void> => {
        try {
            await axios.post('/api/log', logMessage);
        } catch (error) {
            if (isAxiosError(error)) {
                // eslint-disable-next-line no-console -- this is our last resort
                console.error('Failed to send log message', logMessage, 'error', error);
            }
        }
    };
}

export const getClientLogger = (instance: string): InstanceLogger => {
    const logger = new ClientLogger();
    return {
        error: (message: string) => logger.sendLogMessage({ level: 'error', message, instance }),
        warn: (message: string) => logger.sendLogMessage({ level: 'warn', message, instance }),
        info: (message: string) => logger.sendLogMessage({ level: 'info', message, instance }),
        debug: (message: string) => logger.sendLogMessage({ level: 'debug', message, instance }),
    };
};
