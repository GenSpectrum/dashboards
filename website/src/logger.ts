import winston, { type Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import { type AdditionalLogContext, type InstanceLogger } from './types/logMessage.ts';

let _logger: Logger | undefined;

const getLogger = (): Logger => {
    if (_logger === undefined) {
        const logPath = import.meta.env.LOG_DIR;
        const serverLogFile = `${logPath}/dashboards_website.log`;
        const transports: winston.transport[] = [new winston.transports.Console()];

        if (logPath !== undefined) {
            transports.push(
                new DailyRotateFile({
                    filename: serverLogFile,
                    zippedArchive: true,
                    datePattern: 'YYYY-MM-DD-HH-MM',
                    maxFiles: 7,
                }),
            );
        }

        _logger = winston.createLogger({
            level: import.meta.env.LOG_LEVEL ?? 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json({})),
            transports,
        });
    }
    return _logger;
};

/**
 * This can only be used in server-side code.
 * In client-side code, use `getClientLogger` instead.
 */
export const getInstanceLogger = (instance: string): InstanceLogger => {
    return {
        error: (message: string, context?: AdditionalLogContext) =>
            getLogger().error(message, { instance, ...context }),
        warn: (message: string, context?: AdditionalLogContext) => getLogger().warn(message, { instance, ...context }),
        info: (message: string, context?: AdditionalLogContext) => getLogger().info(message, { instance, ...context }),
        debug: (message: string, context?: AdditionalLogContext) =>
            getLogger().debug(message, { instance, ...context }),
    };
};
