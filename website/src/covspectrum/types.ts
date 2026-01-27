import { z } from 'zod';

export const collectionVariantSchema = z.object({
    name: z.string(),
    query: z.string(),
    description: z.string(),
});

export const collectionSchema = z.object({
    id: z.number(),
    title: z.string(),
    variants: z.array(collectionVariantSchema),
});

export const collectionsResponseSchema = z.array(collectionSchema);

export type CollectionVariant = z.infer<typeof collectionVariantSchema>;
export type Collection = z.infer<typeof collectionSchema>;
