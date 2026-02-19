import axios from 'axios';
import { z } from 'zod';

import { getClientLogger } from '../clientLogger.ts';
import { siloFilterExpressionSchema } from './siloFilterExpression.ts';

const logger = getClientLogger('parseQuery');

const parsedQueryResultSuccessSchema = z.object({
    type: z.literal('success'),
    filter: siloFilterExpressionSchema,
});

const parsedQueryResultFailureSchema = z.object({
    type: z.literal('failure'),
    error: z.string(),
});

export const parsedQueryResultSchema = z.discriminatedUnion('type', [
    parsedQueryResultSuccessSchema,
    parsedQueryResultFailureSchema,
]);

export type ParsedQueryResult = z.infer<typeof parsedQueryResultSchema>;

const queryParseResponseSchema = z.object({
    data: z.array(parsedQueryResultSchema),
});

/**
 * Parses a list of advanced query strings into SILO filter expressions.
 * Returns partial results: successfully parsed queries will have a "filter" field,
 * while failed queries will have an "error" field with the error message.
 *
 * @param lapisUrl The base API URL
 * @param queries Array of advanced query strings to parse
 * @returns Array of parsed query results (success or failure for each query)
 */
export async function parseQuery(lapisUrl: string, queries: string[]): Promise<ParsedQueryResult[]> {
    const url = `${lapisUrl}/query/parse`;
    const body = { queries };

    let response;
    try {
        response = await axios.post(url, body);
    } catch (error) {
        const message = `Failed to parse queries: ${JSON.stringify(error)}`;
        logger.error(message);
        throw new Error(message);
    }

    const parsedResponse = queryParseResponseSchema.safeParse(response.data);
    if (!parsedResponse.success) {
        const message = `Failed to parse query response: ${JSON.stringify(parsedResponse.error)} (was ${JSON.stringify(response.data)})`;
        logger.error(message);
        throw new Error(message);
    }

    return parsedResponse.data.data;
}
