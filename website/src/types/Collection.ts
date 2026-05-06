import { z } from 'zod';

const filterObjectSchema = z
    .object({
        aminoAcidMutations: z.array(z.string()).optional(),
        nucleotideMutations: z.array(z.string()).optional(),
        aminoAcidInsertions: z.array(z.string()).optional(),
        nucleotideInsertions: z.array(z.string()).optional(),
    })
    .catchall(z.string());

const queryVariantSchema = z.object({
    type: z.literal('query'),
    id: z.number(),
    collectionId: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    countQuery: z.string(),
    coverageQuery: z.string().nullable(),
});

const filterObjectVariantSchema = z.object({
    type: z.literal('filterObject'),
    id: z.number(),
    collectionId: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    filterObject: filterObjectSchema,
});

const variantSchema = z.discriminatedUnion('type', [queryVariantSchema, filterObjectVariantSchema]);

export const collectionSchema = z.object({
    id: z.number(),
    name: z.string(),
    ownedBy: z.number(),
    organism: z.string(),
    description: z.string().nullable(),
    variants: z.array(variantSchema),
});

export type Collection = z.infer<typeof collectionSchema>;
export type Variant = z.infer<typeof variantSchema>;
export type FilterObject = z.infer<typeof filterObjectSchema>;

export const FILTER_OBJECT_ARRAY_FIELD_LABELS = {
    aminoAcidMutations: 'Amino acid mutations',
    nucleotideMutations: 'Nucleotide mutations',
    aminoAcidInsertions: 'Amino acid insertions',
    nucleotideInsertions: 'Nucleotide insertions',
} as const;

/** Returns a filter object for the given variant that can be used as the body of a LAPIS API request. */
export function getVariantFilter(variant: Variant): Record<string, unknown> {
    if (variant.type === 'query') {
        return { advancedQuery: variant.countQuery };
    }
    return { ...variant.filterObject };
}

export function getLineageFields(filterObject: FilterObject): [string, string][] {
    const knownKeys = Object.keys(FILTER_OBJECT_ARRAY_FIELD_LABELS);
    return Object.entries(filterObject).filter(([key]) => !knownKeys.includes(key)) as [string, string][];
}

// Request schemas (create)
const queryVariantRequestSchema = z.object({
    type: z.literal('query'),
    name: z.string(),
    description: z.string().optional(),
    countQuery: z.string(),
    coverageQuery: z.string().optional(),
});

const filterObjectVariantRequestSchema = z.object({
    type: z.literal('filterObject'),
    name: z.string(),
    description: z.string().optional(),
    filterObject: filterObjectSchema,
});

const variantRequestSchema = z.discriminatedUnion('type', [
    queryVariantRequestSchema,
    filterObjectVariantRequestSchema,
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
const filterObjectVariantUpdateSchema = filterObjectVariantRequestSchema.extend({ id: z.number().optional() });

const variantUpdateSchema = z.discriminatedUnion('type', [queryVariantUpdateSchema, filterObjectVariantUpdateSchema]);

export const collectionUpdateSchema = collectionRequestSchema
    .omit({ organism: true })
    .partial()
    .extend({
        variants: z.array(variantUpdateSchema).optional(),
    });

export type CollectionUpdate = z.infer<typeof collectionUpdateSchema>;
export type VariantUpdate = z.infer<typeof variantUpdateSchema>;
