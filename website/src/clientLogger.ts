import axios from 'axios';

import { type AdditionalLogContext, type InstanceLogger, type LogMessage } from './types/logMessage.ts';

class ClientLogger {
    public sendLogMessage = async (logMessage: LogMessage): Promise<void> => {
        try {
            await axios.post('/api/log', logMessage);
        } catch (error) {
            // eslint-disable-next-line no-console -- this is our last resort
            console.error('Failed to send log message', logMessage, 'error', error);
        }
    };
}

export const getClientLogger = (instance: string): InstanceLogger => {
    const logger = new ClientLogger();
    return {
        error: (message: string, context?: AdditionalLogContext) =>
            void logger.sendLogMessage({
                level: 'error',
                message,
                instance,
                ...context,
            }),
        warn: (message: string, context?: AdditionalLogContext) =>
            void logger.sendLogMessage({
                level: 'warn',
                message,
                instance,
                ...context,
            }),
        info: (message: string, context?: AdditionalLogContext) =>
            void logger.sendLogMessage({
                level: 'info',
                message,
                instance,
                ...context,
            }),
        debug: (message: string, context?: AdditionalLogContext) =>
            void logger.sendLogMessage({
                level: 'debug',
                message,
                instance,
                ...context,
            }),
    };
};
