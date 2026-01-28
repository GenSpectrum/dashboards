import { z } from 'zod';

export const collectionVariantSchema = z.object({
    query: z.string(),
    name: z.string(),
    description: z.string(),
    highlighted: z.boolean(),
});

export const collectionSchema = z.object({
    id: z.number(),
    title: z.string(),
    description: z.string(),
    maintainers: z.string(),
    email: z.string(),
    variants: z.array(collectionVariantSchema),
});

export const collectionsResponseSchema = z.array(collectionSchema);

export type CollectionVariant = z.infer<typeof collectionVariantSchema>;
export type Collection = z.infer<typeof collectionSchema>;
