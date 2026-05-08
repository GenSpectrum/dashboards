import { z } from 'zod';

export const publicUserSchema = z.object({
    id: z.number(),
    name: z.string(),
});

export type PublicUser = z.infer<typeof publicUserSchema>;
