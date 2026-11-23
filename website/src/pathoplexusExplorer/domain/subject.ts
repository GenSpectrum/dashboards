import { UNASSIGNED, type Hierarchy } from './lineages.ts';
import { decodedValue } from './text.ts';

export type SubtypeLevel = {
    column: string;
    label: string;
};

export type Pathogen = {
    kind: 'pathogen';
    table: string;
    label: string;
    levels: readonly SubtypeLevel[];
    alternatives: readonly SubtypeLevel[];
    /** Subtypes offered alongside pathogens in the picker. */
    menuSubtypes: readonly SubtypeStep[];
    /** The subtype column that selects a reference genome, if the pathogen has more than one. */
    referenceColumn?: string;
    geneOrder?: readonly string[];
};

export type Family = {
    kind: 'family';
    id: string;
    label: string;
    pathogens: readonly Pathogen[];
};

export type Group = {
    id: string;
    label: string;
    members: readonly (Family | Pathogen)[];
};

export type Catalog = { groups: readonly Group[] };

export type SubtypeStep = { column: string; value: string };

export type Subject =
    | { kind: 'all' }
    | { kind: 'group'; group: Group }
    | { kind: 'family'; family: Family; group: Group }
    | { kind: 'pathogen'; pathogen: Pathogen; family?: Family; group: Group }
    | { kind: 'subtype'; pathogen: Pathogen; family?: Family; group: Group; steps: readonly SubtypeStep[] };

export const ALL: Subject = { kind: 'all' };

export type PathogenNode = Extract<Subject, { kind: 'pathogen' | 'subtype' }>;

export function isPathogenNode(node: Subject | undefined): node is PathogenNode {
    return node?.kind === 'pathogen' || node?.kind === 'subtype';
}

/** Some subtypes, such as dengue serotypes, have their own virus reports. */
export function isMenuSubtype(node: Subject): boolean {
    if (node.kind !== 'subtype' || node.steps.length !== 1) {
        return false;
    }
    const [step] = node.steps;
    return isMenuStep(node.pathogen, step);
}

function isMenuStep(pathogen: Pathogen, step: SubtypeStep): boolean {
    return pathogen.menuSubtypes.some(
        (candidate) => candidate.column === step.column && candidate.value === step.value,
    );
}

export function menuSubjectOf(node: Subject): Subject {
    return isPathogenNode(node) ? keepSteps(node, (step) => isMenuStep(node.pathogen, step)) : node;
}

export function pathogenOf(node: Subject | undefined): Pathogen | undefined {
    return isPathogenNode(node) ? node.pathogen : undefined;
}

/** Collapse groups with one member in the navigation. */
function isCollapsed(group: Group): boolean {
    return group.members.length === 1;
}

function aboveGroup(group: Group): Subject[] {
    return isCollapsed(group) ? [ALL] : [ALL, { kind: 'group', group }];
}

function groupNode(group: Group): Subject {
    if (!isCollapsed(group)) {
        return { kind: 'group', group };
    }
    const member = group.members[0];
    return member.kind === 'family'
        ? { kind: 'family', family: member, group }
        : { kind: 'pathogen', pathogen: member, group };
}

export function allPathogens(catalog: Catalog): Pathogen[] {
    return catalog.groups.flatMap((group) =>
        group.members.flatMap((member) => (member.kind === 'family' ? member.pathogens : [member])),
    );
}

export function subtypeColumns(catalog: Catalog): { table: string; column: string }[] {
    return allPathogens(catalog).flatMap((pathogen) =>
        namingLevels(pathogen).map((level) => ({ table: pathogen.table, column: level.column })),
    );
}

export function locate(
    catalog: Catalog,
    table: string,
): { pathogen: Pathogen; family?: Family; group: Group } | undefined {
    for (const group of catalog.groups) {
        for (const member of group.members) {
            if (member.kind === 'pathogen' && member.table === table) {
                return { pathogen: member, group };
            }
            if (member.kind === 'family') {
                const pathogen = member.pathogens.find((candidate) => candidate.table === table);
                if (pathogen) {
                    return { pathogen, family: member, group };
                }
            }
        }
    }
    return undefined;
}

export function subjectKey(node: Subject): string {
    switch (node.kind) {
        case 'all':
            return '';
        case 'group':
            return `group:${node.group.id}`;
        case 'family':
            return `family:${node.family.id}`;
        case 'pathogen':
            return `pathogen:${node.pathogen.table}`;
        case 'subtype':
            return [
                `pathogen:${node.pathogen.table}`,
                ...node.steps.map((step) => `${step.column}=${encodeURIComponent(step.value)}`),
            ].join('/');
    }
}

export function parseSubject(key: string | null | undefined, catalog: Catalog): Subject | undefined {
    if (key === null || key === undefined || key === '') {
        return ALL;
    }
    const [head, ...rest] = key.split('/');
    const separator = head.indexOf(':');
    const kind = head.slice(0, separator);
    const id = head.slice(separator + 1);
    if (kind === 'group') {
        const group = catalog.groups.find((candidate) => candidate.id === id);
        return group === undefined ? undefined : groupNode(group);
    }
    if (kind === 'family') {
        for (const group of catalog.groups) {
            const family = group.members.find(
                (member): member is Family => member.kind === 'family' && member.id === id,
            );
            if (family) {
                return { kind: 'family', family, group };
            }
        }
        return undefined;
    }
    if (kind !== 'pathogen') {
        return undefined;
    }
    const located = locate(catalog, id);
    if (!located) {
        return undefined;
    }
    if (rest.length === 0) {
        return { kind: 'pathogen', ...located };
    }
    const columns = namingLevels(located.pathogen).map((level) => level.column);
    const given: (SubtypeStep & { level: number })[] = [];
    for (const part of rest) {
        const equals = part.indexOf('=');
        const column = part.slice(0, equals);
        const level = columns.indexOf(column);
        if (equals <= 0 || level < 0) {
            return undefined;
        }
        given.push({ column, value: decodedValue(part.slice(equals + 1)), level });
    }
    // Order URL steps by classification level so the last step identifies the report subject.
    const steps: SubtypeStep[] = given
        .sort((a, b) => a.level - b.level)
        .map(({ column, value }) => ({ column, value }));
    return { kind: 'subtype', ...located, steps };
}

export function subjectLabel(node: Subject): string {
    switch (node.kind) {
        case 'all':
            return 'All pathogens';
        case 'group':
            return node.group.label;
        case 'family':
            return node.family.label;
        case 'pathogen':
            return node.pathogen.label;
        case 'subtype': {
            const last = node.steps[node.steps.length - 1];
            return last.value === UNASSIGNED
                ? `${levelOf(node.pathogen, last.column)?.label ?? last.column} unassigned`
                : last.value;
        }
    }
}

export function subjectTitle(node: Subject): string {
    return node.kind === 'subtype' ? `${node.pathogen.label} · ${subjectLabel(node)}` : subjectLabel(node);
}

export function subjectPhrase(node: Subject): string {
    return node.kind === 'group' ? `${node.group.label} pathogens` : subjectTitle(node);
}

export function namingLevels(pathogen: Pathogen): SubtypeLevel[] {
    return [...pathogen.levels, ...pathogen.alternatives];
}

export function levelOf(pathogen: Pathogen, column: string): SubtypeLevel | undefined {
    return namingLevels(pathogen).find((level) => level.column === column);
}

/** Returns ancestors from the broadest group to the immediate parent using the supplied lineage hierarchy. */
export function subjectAncestors(node: Subject, hierarchy: Hierarchy): Subject[] {
    switch (node.kind) {
        case 'all':
            return [];
        case 'group':
            return [ALL];
        case 'family':
            return aboveGroup(node.group);
        case 'pathogen': {
            if (node.family) {
                const family: Subject = { kind: 'family', family: node.family, group: node.group };
                return [...subjectAncestors(family, hierarchy), family];
            }
            return aboveGroup(node.group);
        }
        case 'subtype': {
            const pathogenNode: Subject = {
                kind: 'pathogen',
                pathogen: node.pathogen,
                family: node.family,
                group: node.group,
            };
            const above = [...subjectAncestors(pathogenNode, hierarchy), pathogenNode];
            const within = (column: string, value: string, ancestor: string) => {
                const tree = hierarchy(node.pathogen.table, column);
                return tree === undefined ? value === ancestor : tree.isWithin(value, ancestor);
            };
            let steps: SubtypeStep[] = [];
            const narrowest = new Map<string, string>();
            const down = (step: SubtypeStep) => {
                // Keep the most specific value for a column when a lineage narrows the same column more than once.
                steps = [
                    ...steps.filter(
                        (kept) => kept.column !== step.column || !within(step.column, step.value, kept.value),
                    ),
                    step,
                ];
                narrowest.set(step.column, step.value);
                above.push({ ...node, steps: [...steps] });
            };
            for (const step of node.steps) {
                const tree = hierarchy(node.pathogen.table, step.column);
                for (const name of tree?.ancestorsOf(step.value) ?? []) {
                    const chosen = narrowest.get(step.column);
                    if (chosen === undefined || !within(step.column, chosen, name)) {
                        down({ column: step.column, value: name });
                    }
                }
                down(step);
            }
            above.pop();
            return above;
        }
    }
}

export function parentSubject(node: Subject, hierarchy: Hierarchy): Subject | undefined {
    return subjectAncestors(node, hierarchy).at(-1);
}

export function pathogensOf(node: Subject, catalog: Catalog): Pathogen[] {
    switch (node.kind) {
        case 'all':
            return allPathogens(catalog);
        case 'group':
            return node.group.members.flatMap((member) => (member.kind === 'family' ? member.pathogens : [member]));
        case 'family':
            return [...node.family.pathogens];
        case 'pathogen':
        case 'subtype':
            return [node.pathogen];
    }
}

/** Drop the selected step and its descendants together. */
export function keepSteps(node: Subject, keep: (step: SubtypeStep) => boolean): Subject {
    if (node.kind !== 'subtype') {
        return node;
    }
    const steps = node.steps.filter(keep);
    return steps.length === 0
        ? { kind: 'pathogen', pathogen: node.pathogen, family: node.family, group: node.group }
        : { ...node, steps };
}

export function withStep(node: Subject, step: SubtypeStep): Subject {
    if (node.kind === 'pathogen') {
        return { kind: 'subtype', pathogen: node.pathogen, family: node.family, group: node.group, steps: [step] };
    }
    if (node.kind === 'subtype') {
        return { ...node, steps: [...node.steps, step] };
    }
    throw new Error(`A subtype step needs a pathogen, not ${node.kind}`);
}

export function effectiveSteps(node: Subject): SubtypeStep[] {
    const byColumn = new Map<string, SubtypeStep>();
    for (const step of node.kind === 'subtype' ? node.steps : []) {
        byColumn.set(step.column, step);
    }
    return [...byColumn.values()];
}

export function staticChildren(node: Subject, catalog: Catalog): Subject[] | undefined {
    switch (node.kind) {
        case 'all':
            return catalog.groups.map(groupNode);
        case 'group':
            return node.group.members.map((member) =>
                member.kind === 'family'
                    ? { kind: 'family', family: member, group: node.group }
                    : { kind: 'pathogen', pathogen: member, group: node.group },
            );
        case 'family':
            return node.family.pathogens.map((pathogen) => ({
                kind: 'pathogen',
                pathogen,
                family: node.family,
                group: node.group,
            }));
        default:
            return undefined;
    }
}

export function childContaining(node: Subject, table: string, catalog: Catalog): Subject | undefined {
    const children = staticChildren(node, catalog);
    return children?.find((child) => pathogensOf(child, catalog).some((pathogen) => pathogen.table === table));
}

export function sameSubject(a: Subject, b: Subject): boolean {
    return subjectKey(a) === subjectKey(b);
}
