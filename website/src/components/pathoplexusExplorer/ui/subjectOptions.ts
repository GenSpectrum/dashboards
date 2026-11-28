import type { Option } from './Picker.tsx';
import { CATALOG } from '../../../pathoplexusExplorer/domain/catalog.ts';
import { CONTINENTS, placeKey, SUBREGION_NAMES, type Place } from '../../../pathoplexusExplorer/domain/geography.ts';
import { formatCount } from '../../../pathoplexusExplorer/domain/statistics.ts';
import {
    isMenuSubtype,
    keepSteps,
    subjectKey,
    withStep,
    type PathogenNode,
    type SubtypeStep,
    type Subject,
} from '../../../pathoplexusExplorer/domain/subject.ts';

export function placeOptions(
    countries: readonly { value: string; label: string; n?: number }[],
    current?: Place,
): Option[] {
    return [
        ...(current?.level === 'admin1'
            ? [
                  {
                      value: placeKey(current),
                      label: `${current.admin1}, ${current.country}`,
                      group: 'Chosen',
                  },
              ]
            : []),
        ...CONTINENTS.map((continent) => ({
            value: placeKey({ level: 'continent', continent }),
            label: continent,
            group: 'Continent',
        })),
        ...SUBREGION_NAMES.map((subregion) => ({
            value: placeKey({ level: 'subregion', subregion }),
            label: subregion,
            group: 'UN region',
        })),
        ...countries.map((country) => ({
            value: placeKey({ level: 'country', country: country.value }),
            label: country.label,
            note: country.n === undefined ? undefined : formatCount(country.n),
            group: 'Country',
        })),
    ];
}

/** Clear descendant choices when their parent changes. */
export function withLevel(
    what: PathogenNode,
    column: string,
    value: string | undefined,
    above?: SubtypeStep,
): PathogenNode {
    const levels = what.pathogen.levels;
    const index = levels.findIndex((level) => level.column === column);
    const kept = new Map((what.kind === 'subtype' ? what.steps : []).map((step) => [step.column, step.value]));
    for (const level of levels.slice(index)) {
        kept.delete(level.column);
    }
    if (value !== undefined) {
        kept.set(column, value);
        if (above !== undefined && kept.get(above.column) === undefined) {
            kept.set(above.column, above.value);
        }
    }
    return nodeOf(what, kept);
}

/** Keep descendant choices when adding their inferred parent. */
export function withAbove(what: PathogenNode, step: SubtypeStep): PathogenNode {
    const kept = new Map((what.kind === 'subtype' ? what.steps : []).map((entry) => [entry.column, entry.value]));
    if (kept.get(step.column) !== undefined) {
        return what;
    }
    kept.set(step.column, step.value);
    return nodeOf(what, kept);
}

function nodeOf(what: PathogenNode, kept: ReadonlyMap<string, string>): PathogenNode {
    let node: PathogenNode = { kind: 'pathogen', pathogen: what.pathogen, family: what.family, group: what.group };
    for (const level of what.pathogen.levels) {
        const chosen = kept.get(level.column);
        if (chosen !== undefined) {
            node = withStep(node, { column: level.column, value: chosen }) as PathogenNode;
        }
    }
    return node;
}

type SubjectScope = {
    wholeGroups?: boolean;
    subtypes?: boolean;
};

export function subjectOptions({ wholeGroups = true, subtypes = false }: SubjectScope = {}): Option[] {
    const options: Option[] = [];
    for (const group of CATALOG.groups) {
        const heading = group.label;
        const grouped = group.members.length > 1;
        if (grouped && wholeGroups) {
            options.push({
                value: subjectKey({ kind: 'group', group }),
                label: `All ${heading.toLowerCase()}`,
                group: heading,
            });
        }
        const indent = grouped && wholeGroups ? 1 : 0;
        for (const member of group.members) {
            if (member.kind !== 'family') {
                options.push(...pathogenOptions({ kind: 'pathogen', pathogen: member, group }, indent, subtypes));
                continue;
            }
            if (wholeGroups) {
                options.push({
                    value: subjectKey({ kind: 'family', family: member, group }),
                    label: `All ${member.label}`,
                    group: heading,
                    depth: indent,
                });
            }
            for (const pathogen of member.pathogens) {
                options.push(
                    ...pathogenOptions(
                        { kind: 'pathogen', pathogen, family: member, group },
                        wholeGroups ? indent + 1 : indent,
                        subtypes,
                    ),
                );
            }
        }
    }
    return options;
}

function pathogenOptions(node: PathogenNode & { kind: 'pathogen' }, depth: number, subtypes: boolean): Option[] {
    const heading = node.group.label;
    const option = { value: subjectKey(node), label: node.pathogen.label, group: heading, depth };
    if (!subtypes) {
        return [option];
    }
    return [
        option,
        ...node.pathogen.menuSubtypes.map((step) => ({
            value: subjectKey(withStep(node, step)),
            label: step.value,
            group: heading,
            depth: depth + 1,
        })),
    ];
}

export function subjectValue(node: Subject, { subtypes = false }: SubjectScope = {}): string | undefined {
    if (node.kind === 'all') {
        return undefined;
    }
    return subjectKey(subtypes && isMenuSubtype(node) ? node : keepSteps(node, () => false));
}
