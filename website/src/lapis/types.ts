import { z } from 'zod';

const baseResponseValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const aggregatedItem = z.object({ count: z.number() }).catchall(baseResponseValueSchema);

export const aggregatedResponse = z.object({
    data: z.array(aggregatedItem),
});
