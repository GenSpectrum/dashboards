import { useMemo } from 'react';

import { genomeMapOf, locateGenes, type GeneLocation, type GenomeMap } from './genes.ts';
import { referenceSequencesQuery } from './queries.ts';
import { ownReferenceName, referenceName } from '../domain/reference.ts';
import { pathogenOf, subjectKey, type Pathogen, type Subject } from '../domain/subject.ts';
import type { ReferenceSequences } from '../domain/variant.ts';
import { merged, useReferenceGenomes, type Loadable } from '../rhydb/hooks/analyses.ts';
import { useRows } from '../rhydb/hooks/rhydb.ts';
import { referenceRowsOf, referenceSequencesFor } from '../rhydb/queries/resolve.ts';

export type ReferenceSymbols = {
    segments: ReadonlyMap<string, string>;
    proteins: ReadonlyMap<string, string>;
};

export type Genome = ReferenceSymbols & {
    genes: Map<string, GeneLocation>;
    repeatedGenes: Set<string>;
    map: GenomeMap;
};

export function useGenome(what: Subject | undefined, enabled: boolean): Loadable<Genome> {
    const references = useReferenceSequences(what);
    const sequences = references.data;
    const pathogen = what === undefined ? undefined : pathogenOf(what);
    const names =
        !enabled || sequences === undefined || pathogen === undefined
            ? []
            : [...sequences.nucleotide, ...sequences.aminoAcid].map((sequence) =>
                  referenceName(pathogen, sequence.name),
              );
    const symbols = useRows(referenceSequencesQuery(names), 'Reference genome');

    const rows = symbols.data;
    const empty = names.length === 0;
    // Locating the genes takes tens of milliseconds for a large genome, so do it once per reference.
    const data = useMemo(
        () =>
            sequences === undefined || pathogen === undefined || rows === undefined || empty
                ? undefined
                : build(sequences, pathogen, rows),
        [sequences, pathogen, rows, empty],
    );
    return merged(data, [references, symbols]);
}

function build(sequences: ReferenceSequences, pathogen: Pathogen, rows: readonly { [key: string]: unknown }[]): Genome {
    const text = new Map(
        rows.flatMap((row) => {
            const name = ownReferenceName(pathogen, String(row.name));
            return name === undefined ? [] : [[name, String(row.sequence).toUpperCase()] as const];
        }),
    );
    const held = (wanted: readonly { name: string }[]) =>
        new Map(
            wanted.flatMap((sequence) => {
                const found = text.get(sequence.name);
                return found === undefined ? [] : [[sequence.name, found] as const];
            }),
        );
    const segments = held(sequences.nucleotide);
    const proteins = held(sequences.aminoAcid);
    const genes = locateGenes({ segments, proteins });
    return { segments, proteins, genes: genes.located, repeatedGenes: genes.repeated, map: genomeMapOf(segments) };
}

/** Load names separately because variant resolution does not need the reference symbols. */
export function useReferenceSequences(what: Subject | undefined): Loadable<ReferenceSequences> {
    const rows = useReferenceGenomes();
    // Keep the reference model stable for dependent variant and mutation calculations.
    const sequences = useMemo(
        () => (what === undefined ? undefined : referenceSequencesFor(what, referenceRowsOf(rows.data ?? []))),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- a node is identified by its key
        [rows.data, what === undefined ? '' : subjectKey(what)],
    );
    return merged(sequences, [rows]);
}
