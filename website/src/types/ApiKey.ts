import { z } from 'zod';

export const apiKeyMetadataSchema = z.object({
    createdAt: z.string(),
    lastUsedAt: z.string().nullable(),
});

export type ApiKeyMetadata = z.infer<typeof apiKeyMetadataSchema>;

export const generatedApiKeySchema = z.object({
    key: z.string(),
    createdAt: z.string(),
});

export type GeneratedApiKey = z.infer<typeof generatedApiKeySchema>;
