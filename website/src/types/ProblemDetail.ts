import { z } from 'zod';

export const problemDetailSchema = z
    .object({
        type: z.string().optional(),
        title: z.string().optional(),
        status: z.number().int().optional(),
        detail: z.string().optional(),
        instance: z.string().optional(),
    })
    .strict();

export type ProblemDetail = z.infer<typeof problemDetailSchema>;
