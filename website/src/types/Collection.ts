import { z } from 'zod';

const mutationListDefinitionSchema = z.object({
    aaMutations: z.array(z.string()).optional(),
    nucMutations: z.array(z.string()).optional(),
    aaInsertions: z.array(z.string()).optional(),
    nucInsertions: z.array(z.string()).optional(),
    filters: z.record(z.string()).optional(),
});

const queryVariantSchema = z.object({
    type: z.literal('query'),
    id: z.number(),
    collectionId: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    countQuery: z.string(),
    coverageQuery: z.string().nullable(),
});

const mutationListVariantSchema = z.object({
    type: z.literal('mutationList'),
    id: z.number(),
    collectionId: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    mutationList: mutationListDefinitionSchema,
});

const variantSchema = z.discriminatedUnion('type', [queryVariantSchema, mutationListVariantSchema]);

export const collectionSchema = z.object({
    id: z.number(),
    name: z.string(),
    ownedBy: z.string(),
    organism: z.string(),
    description: z.string().nullable(),
    variants: z.array(variantSchema),
});

export type Collection = z.infer<typeof collectionSchema>;
export type Variant = z.infer<typeof variantSchema>;
export type MutationListDefinition = z.infer<typeof mutationListDefinitionSchema>;

// Request schemas (create)
const queryVariantRequestSchema = z.object({
    type: z.literal('query'),
    name: z.string(),
    description: z.string().optional(),
    countQuery: z.string(),
    coverageQuery: z.string().optional(),
});

const mutationListVariantRequestSchema = z.object({
    type: z.literal('mutationList'),
    name: z.string(),
    description: z.string().optional(),
    mutationList: mutationListDefinitionSchema,
});

const variantRequestSchema = z.discriminatedUnion('type', [
    queryVariantRequestSchema,
    mutationListVariantRequestSchema,
]);

export const collectionRequestSchema = z.object({
    name: z.string(),
    organism: z.string(),
    description: z.string().optional(),
    variants: z.array(variantRequestSchema),
});

export type CollectionRequest = z.infer<typeof collectionRequestSchema>;
export type VariantRequest = z.infer<typeof variantRequestSchema>;

// Update schemas (partial, variants have optional id)
const queryVariantUpdateSchema = queryVariantRequestSchema.extend({ id: z.number().optional() });
const mutationListVariantUpdateSchema = mutationListVariantRequestSchema.extend({ id: z.number().optional() });

const variantUpdateSchema = z.discriminatedUnion('type', [queryVariantUpdateSchema, mutationListVariantUpdateSchema]);

export const collectionUpdateSchema = collectionRequestSchema
    .omit({ organism: true })
    .partial()
    .extend({
        variants: z.array(variantUpdateSchema).optional(),
    });

export type CollectionUpdate = z.infer<typeof collectionUpdateSchema>;
export type VariantUpdate = z.infer<typeof variantUpdateSchema>;
