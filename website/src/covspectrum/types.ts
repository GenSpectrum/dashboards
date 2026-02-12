import { z } from 'zod';

export const collectionVariantRawSchema = z.object({
    query: z.string(),
    name: z.string(),
    description: z.string(),
    highlighted: z.boolean(),
});

export const collectionRawSchema = z.object({
    id: z.number(),
    title: z.string(),
    description: z.string(),
    maintainers: z.string(),
    email: z.string(),
    variants: z.array(collectionVariantRawSchema),
});

export const collectionsRawResponseSchema = z.array(collectionRawSchema);

export type CollectionVariantRaw = z.infer<typeof collectionVariantRawSchema>;
export type CollectionRaw = z.infer<typeof collectionRawSchema>;

export const variantQuerySchema = z.object({
    type: z.literal('variantQuery'),
    variantQuery: z.string(),
});

export const detailedMutationsQuerySchema = z.object({
    type: z.literal('detailedMutations'),
    pangoLineage: z.string().optional(),
    nextcladePangoLineage: z.string().optional(),
    nucMutations: z.array(z.string()).optional(),
    aaMutations: z.array(z.string()).optional(),
    nucInsertions: z.array(z.string()).optional(),
    aaInsertions: z.array(z.string()).optional(),
});

export const collectionVariantSchema = z.object({
    query: z.discriminatedUnion('type', [variantQuerySchema, detailedMutationsQuerySchema]),
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

export type CollectionVariant = z.infer<typeof collectionVariantSchema>;
export type Collection = z.infer<typeof collectionSchema>;
