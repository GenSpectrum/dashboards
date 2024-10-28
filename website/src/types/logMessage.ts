import { z } from 'zod';

export const logLevels = ['error', 'warn', 'info', 'debug'] as const;

export const logMessageSchema = z.object({
    level: z.enum(logLevels),
    message: z.string(),
    instance: z.string(),
});
export type LogMessage = z.infer<typeof logMessageSchema>;

export type InstanceLogger = {
    [key in (typeof logLevels)[number]]: (message: string) => void;
};
