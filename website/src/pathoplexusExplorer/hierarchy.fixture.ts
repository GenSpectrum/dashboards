/** Examples from RhyDB lineage definitions used in tests. */

import { lineageTreeOf, type Hierarchy, type LineageDefinition } from './domain/lineages.ts';

/* eslint-disable @typescript-eslint/naming-convention -- the keys are lineage names as the instance holds them */

const RSV_A_LINEAGE: LineageDefinition = {
    'A': {},
    'A.1': { parents: ['A'] },
    'A.2': { parents: ['A'] },
    'A.3': { parents: ['A'] },
    'A.3.1': { parents: ['A.3'] },
    'A.3.1.1': { parents: ['A.3.1'] },
    'A.D': { parents: ['A.3.1.1'] },
    'A.D.1': { parents: ['A.D'] },
    'A.D.5': { parents: ['A.D'] },
    'A.D.5.2': { parents: ['A.D.5'] },
};

const RSV_B_LINEAGE: LineageDefinition = {
    'B': {},
    'B.D': { parents: ['B'] },
    'B.D.1': { parents: ['B.D'] },
    'B.D.4': { parents: ['B.D'] },
    'B.D.4.1': { parents: ['B.D.4'] },
    'B.D.4.1.1': { parents: ['B.D.4.1'] },
    'B.D.E.1': { parents: ['B.D.4.1.1'] },
    'B.D.E.1.1': { parents: ['B.D.E.1'] },
};

const HMPV_LINEAGE: LineageDefinition = {
    'A': {},
    'A1': { parents: ['A'] },
    'A2': { parents: ['A'] },
    'A2.1': { parents: ['A2'] },
    'B': {},
    'B1': { parents: ['B'] },
};

const DENGUE_LINEAGE: LineageDefinition = {
    '1I': {},
    '1I_K': { parents: ['1I'] },
    '1I_K.1': { parents: ['1I_K'] },
    '1I_K.1.1': { parents: ['1I_K'] },
    '1I_K.1.1.1': { parents: ['1I_K'] },
    '2II': {},
    '2II_A': { parents: ['2II'] },
    '2II_A.1': { parents: ['2II_A'] },
    'unassigned': {},
};

const MARBURG_CLADE: LineageDefinition = {
    'MARV': {},
    'MARV.A': { parents: ['MARV'] },
    'MARV.A.1': { parents: ['MARV.A'] },
    'MARV.B': { parents: ['MARV'] },
    'MARV.B.2': { parents: ['MARV.B'] },
    'RAVV': {},
    'RAVV.1': { parents: ['RAVV'] },
    'unassigned': {},
};

const MPOX_OUTBREAK_LINEAGE: LineageDefinition = {
    'sh2017/A': {},
    'sh2017/A.1': { parents: ['sh2017/A'] },
    'sh2017/A.1.1': { parents: ['sh2017/A.1'] },
    'sh2017/B.1': { parents: ['sh2017/A.1.1'] },
    'sh2017/B.1.3': { parents: ['sh2017/B.1'] },
    'sh2023/A': {},
    'sh2023/A.1': { parents: ['sh2023/A'] },
    'None': {},
};

const CCHF_LINEAGE_S: LineageDefinition = {
    'I': {},
    'IV': {},
    'IV.1': { parents: ['IV'] },
    'IV.2': { parents: ['IV'] },
    'unassigned': {},
};

const DEFINITIONS: Readonly<Record<string, LineageDefinition>> = {
    'rsv_a|lineage': RSV_A_LINEAGE,
    'rsv_b|lineage': RSV_B_LINEAGE,
    'hmpv|lineage': HMPV_LINEAGE,
    'dengue|lineage': DENGUE_LINEAGE,
    'marburg|clade': MARBURG_CLADE,
    'mpox|outbreakLineage': MPOX_OUTBREAK_LINEAGE,
    'cchf|lineage_S': CCHF_LINEAGE_S,
};

const TREES = new Map(Object.entries(DEFINITIONS).map(([key, definition]) => [key, lineageTreeOf(definition)]));

export const HIERARCHY: Hierarchy = (table, column) => TREES.get(`${table}|${column}`);
