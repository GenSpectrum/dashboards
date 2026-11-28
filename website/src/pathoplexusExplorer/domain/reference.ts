/** Dengue uses a separate reference genome for each serotype. */

import type { Hierarchy } from './lineages.ts';
import {
    effectiveSteps,
    isPathogenNode,
    pathogenOf,
    subjectAncestors,
    type Pathogen,
    type Subject,
} from './subject.ts';
import type { ReferenceSequence, ReferenceSequences } from './variant.ts';

export type ReferenceRow = { name: string; type: string };

/** Reference sequence names are qualified as `<table>:<sequence>` in RhyDB. */
export function referenceName(pathogen: Pathogen, name: string): string {
    return `${pathogen.table}_${name}`;
}

export function ownReferenceName(pathogen: Pathogen, name: string): string | undefined {
    const prefix = `${pathogen.table}_`;
    return name.startsWith(prefix) ? name.slice(prefix.length) : undefined;
}

export type ReferenceChoice =
    { status: 'single' } | { status: 'chosen'; column: string; value: string } | { status: 'needed'; column: string };

export function referenceOf(pathogen: Pathogen, what: Subject): ReferenceChoice {
    const column = pathogen.referenceColumn;
    if (column === undefined) {
        return { status: 'single' };
    }
    const step = effectiveSteps(what).find((candidate) => candidate.column === column);
    return step === undefined ? { status: 'needed', column } : { status: 'chosen', column, value: step.value };
}

export function referenceKeyOf(pathogen: Pathogen, what: Subject): string | undefined {
    const reference = referenceOf(pathogen, what);
    switch (reference.status) {
        case 'single':
            return pathogen.table;
        case 'chosen':
            return `${pathogen.table}:${reference.value}`;
        case 'needed':
            return undefined;
    }
}

/** Returns the nearest ancestor with the same reference genome. */
export function comparableParentOf(node: Subject, hierarchy: Hierarchy): Subject | undefined {
    const pathogen = pathogenOf(node);
    if (pathogen === undefined) {
        return undefined;
    }
    const key = referenceKeyOf(pathogen, node);
    if (key === undefined) {
        return undefined;
    }
    for (const ancestor of [...subjectAncestors(node, hierarchy)].reverse()) {
        if (!isPathogenNode(ancestor)) {
            return undefined;
        }
        if (referenceKeyOf(ancestor.pathogen, ancestor) === key) {
            return ancestor;
        }
    }
    return undefined;
}

export function referenceSequencesOf(
    pathogen: Pathogen,
    reference: ReferenceChoice,
    rows: readonly ReferenceRow[],
): ReferenceSequences {
    const own = rows.flatMap((row) => {
        const name = ownReferenceName(pathogen, row.name);
        return name === undefined ? [] : [{ name, type: row.type }];
    });
    const displayOf = (name: string): string | undefined => {
        if (reference.status !== 'chosen') {
            return name;
        }
        if (name === reference.value) {
            return '';
        }
        const suffix = `-${reference.value}`;
        return name.endsWith(suffix) ? name.slice(0, -suffix.length) : undefined;
    };
    const pick = (type: string): ReferenceSequence[] =>
        own
            .filter((row) => row.type === type)
            .map((row) => ({ name: row.name, display: displayOf(row.name) }))
            .filter((row): row is ReferenceSequence => row.display !== undefined);
    const nucleotide = pick('nucleotide');
    if (nucleotide.length === 1) {
        nucleotide[0] = { ...nucleotide[0], display: '' };
    }
    const order = new Map((pathogen.geneOrder ?? []).map((gene, index) => [gene, index]));
    const aminoAcid = pick('amino_acid')
        .map((sequence, index) => ({ sequence, index }))
        .sort(
            (a, b) =>
                (order.get(a.sequence.display) ?? order.size + a.index) -
                (order.get(b.sequence.display) ?? order.size + b.index),
        )
        .map(({ sequence }) => sequence);
    return { nucleotide, aminoAcid };
}

export function sequenceRank(sequences: ReferenceSequences): Map<string, number> {
    return new Map([...sequences.nucleotide, ...sequences.aminoAcid].map((sequence, index) => [sequence.name, index]));
}

export function displayNameOf(sequences: ReferenceSequences, name: string): string {
    return (
        sequences.aminoAcid.find((sequence) => sequence.name === name)?.display ??
        sequences.nucleotide.find((sequence) => sequence.name === name)?.display ??
        name
    );
}
