import type { Catalog, Family, Pathogen } from './subject.ts';
import {
    VIRUS_GROUPS,
    type CatalogVirus,
    type CatalogVirusFamily,
    type CatalogVirusGroup,
} from '../mappingData/virusCatalog.ts';

function pathogenOf(data: CatalogVirus): Pathogen {
    return {
        kind: 'pathogen',
        table: data.table,
        label: data.label,
        levels: data.levels ?? [],
        alternatives: data.alternatives ?? [],
        menuSubtypes: data.menuSubtypes ?? [],
        referenceColumn: data.referenceColumn,
        geneOrder: data.geneOrder,
    };
}

function familyOf(data: CatalogVirusFamily): Family {
    return { kind: 'family', id: data.id, label: data.label, pathogens: data.pathogens.map(pathogenOf) };
}

function memberOf(data: CatalogVirusGroup['members'][number]): Family | Pathogen {
    return 'pathogens' in data ? familyOf(data) : pathogenOf(data);
}

export const CATALOG: Catalog = {
    groups: VIRUS_GROUPS.map((group) => ({
        id: group.id,
        label: group.label,
        members: group.members.map(memberOf),
    })),
};
