import axios from 'axios';

import { getClientLogger } from '../clientLogger.ts';
import { aggregatedResponse } from './types.ts';

const logger = getClientLogger('getCladeLineages');

/**
 * Finds the lineage definition belonging to clades, by looking for the lineage that is most
 * commonly associated with each clade.
 * Returns a map, mapping all clades found in the data to their respective lineage.
 */
export async function getCladeLineages(
    baseUrl: string,
    cladeField: string,
    lineageField: string,
    withAsterisk = false,
): Promise<Record<string, string>> {
    const url = `${baseUrl.replace(/\/$/, '')}/sample/aggregated`;
    const body = {
        fields: [cladeField, lineageField],
        orderBy: [cladeField, { field: 'count', type: 'descending' }],
    };

    let response;
    try {
        response = await axios.post(url, body);
    } catch (error) {
        const message = `Failed to fetch clade lineages: ${JSON.stringify(error)}`;
        logger.error(message);
        throw new Error(message);
    }

    const parsedResponse = aggregatedResponse.safeParse(response.data);
    if (!parsedResponse.success) {
        const message = `Failed to parse clade lineages response: ${JSON.stringify(parsedResponse)} (was ${JSON.stringify(response.data)})`;
        logger.error(message);
        throw new Error(message);
    }

    const mapping: Record<string, string> = {};

    for (const row of parsedResponse.data.data) {
        const clade = row[cladeField];
        const lineage = row[lineageField];

        if (clade === null || lineage === null || clade === 'recombinant') {
            continue;
        }

        if (typeof clade !== 'string' || typeof lineage !== 'string') {
            throw new Error(`Unexpected row types in clade lineages response: ${JSON.stringify(row)}`);
        }

        if (!(clade in mapping)) {
            mapping[clade] = withAsterisk ? `${lineage}*` : lineage;
        }
    }

    return mapping;
}
