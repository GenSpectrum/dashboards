/** RhyDB supplies the hierarchical columns and their lineage definitions. */

import { field, textLiteral, type Expr } from '../transport/expression.ts';
import { table, type Relation } from '../transport/relation.ts';

export const DEFINITION_COLUMN = 'column_name';
export const DEFINITION_JSON = 'definition';

/** Lineage relation names include both the table and the column. */
export function definitionNameOf(tableName: string, column: string): string {
    return `${tableName}_${column}`;
}

export function definitionRelationsOf(tableName: string, column: string): { definitions: Expr; aliases: Expr } {
    const name = definitionNameOf(tableName, column);
    return { definitions: field(name), aliases: field(`${name}_aliases`) };
}

export function lineageDefinitionsQuery(columns: readonly { table: string; column: string }[]): Relation | undefined {
    const names = [...new Set(columns.map((need) => definitionNameOf(need.table, need.column)))];
    if (names.length === 0) {
        return undefined;
    }
    return table('lineage_definitions')
        .filter(field(DEFINITION_COLUMN).isIn(names.map(textLiteral)))
        .project([DEFINITION_COLUMN, DEFINITION_JSON]);
}
