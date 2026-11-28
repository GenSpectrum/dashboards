import { getStagingRhydbUrl } from './pathoplexusExplorerConfig.ts';
import { groupAcross } from '../src/pathoplexusExplorer/dataLayer/queries/builders.ts';
import { connect } from '../src/pathoplexusExplorer/dataLayer/transport/connection.ts';
import type { RhydbRow } from '../src/pathoplexusExplorer/dataLayer/transport/row.ts';
import { CATALOG } from '../src/pathoplexusExplorer/domain/catalog.ts';
import { allPathogens } from '../src/pathoplexusExplorer/domain/subject.ts';

export function argumentOf(name: string): string | undefined {
    const index = process.argv.indexOf(`--${name}`);
    return index < 0 ? undefined : process.argv[index + 1];
}

/**
 * Groups the union-all across all pathogens by the `columns` and count the combinations.
 * Queries the staging RhyDB instance unless `--instance <url>` is passed.
 */
export async function recordedValues(columns: readonly string[]): Promise<RhydbRow[]> {
    const url = argumentOf('instance') ?? (await getStagingRhydbUrl());
    const tables = allPathogens(CATALOG).map((pathogen) => pathogen.table);
    const query = groupAcross({ tables, columns, filter: () => undefined });
    return (await connect({ url }).query(query, 'Mapping data')).rows;
}
