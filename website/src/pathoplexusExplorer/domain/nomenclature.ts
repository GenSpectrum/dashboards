import { isPathogenNode, type Subject } from './subject.ts';
import { LINEAGE_NOMENCLATURE, type NomenclaturePart } from '../mappingData/lineageNomenclature.ts';

export type { NomenclaturePart };

export function nomenclatureOf(what: Subject): readonly NomenclaturePart[] | undefined {
    return isPathogenNode(what) ? LINEAGE_NOMENCLATURE[what.pathogen.table] : undefined;
}
