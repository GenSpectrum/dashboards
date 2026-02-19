import { z } from "zod";

// ============================================================================
// LapisInfo Schema
// ============================================================================

export const lapisInfoSchema = z.object({
  dataVersion: z.string().nullable(),
  requestId: z.string().nullable(),
  requestInfo: z.string().nullable(),
  reportTo: z.string(),
  lapisVersion: z.string().nullable(),
  siloVersion: z.string().nullable(),
});

export type LapisInfo = z.infer<typeof lapisInfoSchema>;

// ============================================================================
// SiloFilterExpression Schemas
// ============================================================================

const stringEqualsSchema = z.object({
  type: z.literal("StringEquals"),
  column: z.string(),
  value: z.string().nullable(),
});

const booleanEqualsSchema = z.object({
  type: z.literal("BooleanEquals"),
  column: z.string(),
  value: z.boolean().nullable(),
});

const lineageEqualsSchema = z.object({
  type: z.literal("Lineage"),
  column: z.string(),
  value: z.string().nullable(),
  includeSublineages: z.boolean(),
});

const nucleotideSymbolEqualsSchema = z.object({
  type: z.literal("NucleotideEquals"),
  sequenceName: z.string().nullable().optional(),
  position: z.number(),
  symbol: z.string(),
});

const hasNucleotideMutationSchema = z.object({
  type: z.literal("HasNucleotideMutation"),
  sequenceName: z.string().nullable().optional(),
  position: z.number(),
});

const aminoAcidSymbolEqualsSchema = z.object({
  type: z.literal("AminoAcidEquals"),
  sequenceName: z.string(),
  position: z.number(),
  symbol: z.string(),
});

const hasAminoAcidMutationSchema = z.object({
  type: z.literal("HasAminoAcidMutation"),
  sequenceName: z.string(),
  position: z.number(),
});

const dateBetweenSchema = z.object({
  type: z.literal("DateBetween"),
  column: z.string(),
  from: z.string().nullable(), // ISO date string
  to: z.string().nullable(), // ISO date string
});

const nucleotideInsertionContainsSchema = z.object({
  type: z.literal("InsertionContains"),
  position: z.number(),
  value: z.string(),
  sequenceName: z.string().nullable().optional(),
});

const aminoAcidInsertionContainsSchema = z.object({
  type: z.literal("AminoAcidInsertionContains"),
  position: z.number(),
  value: z.string(),
  sequenceName: z.string(),
});

const trueSchema = z.object({
  type: z.literal("True"),
});

const intEqualsSchema = z.object({
  type: z.literal("IntEquals"),
  column: z.string(),
  value: z.number().nullable(),
});

const intBetweenSchema = z.object({
  type: z.literal("IntBetween"),
  column: z.string(),
  from: z.number().nullable(),
  to: z.number().nullable(),
});

const floatEqualsSchema = z.object({
  type: z.literal("FloatEquals"),
  column: z.string(),
  value: z.number().nullable(),
});

const floatBetweenSchema = z.object({
  type: z.literal("FloatBetween"),
  column: z.string(),
  from: z.number().nullable(),
  to: z.number().nullable(),
});

const stringSearchSchema = z.object({
  type: z.literal("StringSearch"),
  column: z.string(),
  searchExpression: z.string().nullable(),
});

const phyloDescendantOfSchema = z.object({
  type: z.literal("PhyloDescendantOf"),
  column: z.string(),
  internalNode: z.string(),
});

// Recursive types for And, Or, Not, Maybe, NOf
// We need to define the base type first, then extend it
export type SiloFilterExpression = z.infer<typeof siloFilterExpressionSchema>;

const andSchema: z.ZodType<{
  type: "And";
  children: SiloFilterExpression[];
}> = z.lazy(() =>
  z.object({
    type: z.literal("And"),
    children: z.array(siloFilterExpressionSchema),
  })
);

const orSchema: z.ZodType<{
  type: "Or";
  children: SiloFilterExpression[];
}> = z.lazy(() =>
  z.object({
    type: z.literal("Or"),
    children: z.array(siloFilterExpressionSchema),
  })
);

const notSchema: z.ZodType<{
  type: "Not";
  child: SiloFilterExpression;
}> = z.lazy(() =>
  z.object({
    type: z.literal("Not"),
    child: siloFilterExpressionSchema,
  })
);

const maybeSchema: z.ZodType<{
  type: "Maybe";
  child: SiloFilterExpression;
}> = z.lazy(() =>
  z.object({
    type: z.literal("Maybe"),
    child: siloFilterExpressionSchema,
  })
);

const nOfSchema: z.ZodType<{
  type: "N-Of";
  numberOfMatchers: number;
  matchExactly: boolean;
  children: SiloFilterExpression[];
}> = z.lazy(() =>
  z.object({
    type: z.literal("N-Of"),
    numberOfMatchers: z.number(),
    matchExactly: z.boolean(),
    children: z.array(siloFilterExpressionSchema),
  })
);

// Combined discriminated union for all SiloFilterExpression types
export const siloFilterExpressionSchema = z.discriminatedUnion("type", [
  stringEqualsSchema,
  booleanEqualsSchema,
  lineageEqualsSchema,
  nucleotideSymbolEqualsSchema,
  hasNucleotideMutationSchema,
  aminoAcidSymbolEqualsSchema,
  hasAminoAcidMutationSchema,
  dateBetweenSchema,
  nucleotideInsertionContainsSchema,
  aminoAcidInsertionContainsSchema,
  trueSchema,
  intEqualsSchema,
  intBetweenSchema,
  floatEqualsSchema,
  floatBetweenSchema,
  stringSearchSchema,
  phyloDescendantOfSchema,
  andSchema,
  orSchema,
  notSchema,
  maybeSchema,
  nOfSchema,
]);

// ============================================================================
// ParsedQueryResult Schemas
// ============================================================================

const parsedQueryResultSuccessSchema = z.object({
  type: z.literal("success"),
  filter: siloFilterExpressionSchema,
});

const parsedQueryResultFailureSchema = z.object({
  type: z.literal("failure"),
  error: z.string(),
});

export const parsedQueryResultSchema = z.discriminatedUnion("type", [
  parsedQueryResultSuccessSchema,
  parsedQueryResultFailureSchema,
]);

export type ParsedQueryResult = z.infer<typeof parsedQueryResultSchema>;

// ============================================================================
// QueryParseResponse Schema
// ============================================================================

export const queryParseResponseSchema = z.object({
  data: z.array(parsedQueryResultSchema),
  info: lapisInfoSchema,
});

export type QueryParseResponse = z.infer<typeof queryParseResponseSchema>;
