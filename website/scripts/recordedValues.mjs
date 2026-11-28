import { groupAcross } from '../src/pathoplexusExplorer/dataLayer/queries/builders.ts';
import { connect } from '../src/pathoplexusExplorer/dataLayer/transport/connection.ts';
import { CATALOG } from '../src/pathoplexusExplorer/domain/catalog.ts';
import { allPathogens } from '../src/pathoplexusExplorer/domain/subject.ts';
import { getStagingRhydbUrl } from './pathoplexusExplorerConfig.mjs';

export function argumentOf(name) {
    const index = process.argv.indexOf(`--${name}`);
    return index < 0 ? undefined : process.argv[index + 1];
}

export async function recordedValues(columns) {
    const url = argumentOf('instance') ?? (await getStagingRhydbUrl());
    const tables = allPathogens(CATALOG).map((pathogen) => pathogen.table);
    const query = groupAcross({ tables, columns, filter: () => undefined });
    return (await connect({ url }).query(query, 'Mapping data')).rows;
}
