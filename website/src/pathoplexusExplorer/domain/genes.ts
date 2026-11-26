/** Locate reference proteins by exact matches in translations of the nucleotide reference. */

import { residueOf, reverseComplement, translate } from './codons.ts';

export type GeneLocation = {
    gene: string;
    segment: string;
    strand: '+' | '-';
    /** First base of the first codon, in 1-based forward-strand coordinates. */
    start: number;
    length: number;
};

/** Genes without exactly one match cannot be placed on the genome figure. */
export type GeneLocations = { located: Map<string, GeneLocation>; repeated: Set<string> };

export type Codon = {
    /** Codon positions in transcription order, in 1-based forward-strand coordinates. */
    positions: [number, number, number];
    /** Reference bases in transcription order, complemented on the reverse strand. */
    bases: string;
    residue: string;
};

export function locateGenes(options: {
    segments: ReadonlyMap<string, string>;
    proteins: ReadonlyMap<string, string>;
}): GeneLocations {
    const located = new Map<string, GeneLocation>();
    const repeated = new Set<string>();
    const frames = new Map<string, string>();
    const frameOf = (segment: string, sequence: string, strand: '+' | '-', frame: number): string => {
        const key = `${segment}|${strand}|${frame}`;
        const found = frames.get(key);
        if (found !== undefined) {
            return found;
        }
        const translated = translate(strand === '+' ? sequence : reverseComplement(sequence), frame);
        frames.set(key, translated);
        return translated;
    };

    for (const [gene, protein] of options.proteins) {
        const wanted = protein.replace(/\*+$/, '');
        if (wanted.length < 3) {
            continue;
        }
        const places: GeneLocation[] = [];
        for (const [segment, sequence] of options.segments) {
            for (const strand of ['+', '-'] as const) {
                for (let frame = 0; frame < 3; frame++) {
                    const translated = frameOf(segment, sequence, strand, frame);
                    for (let at = translated.indexOf(wanted); at !== -1; at = translated.indexOf(wanted, at + 1)) {
                        const offset = frame + at * 3;
                        places.push({
                            gene,
                            segment,
                            strand,
                            start: strand === '+' ? offset + 1 : sequence.length - offset,
                            length: wanted.length,
                        });
                    }
                }
            }
        }
        // Repeated matches, including those in terminal inverted repeats, do not identify a unique location.
        if (places.length === 1) {
            located.set(gene, places[0]);
        } else if (places.length > 1) {
            repeated.add(gene);
        }
    }
    return { located, repeated };
}

export function codonOf(location: GeneLocation, residue: number, segment: string): Codon | undefined {
    if (residue < 1 || residue > location.length) {
        return undefined;
    }
    const step = location.strand === '+' ? 1 : -1;
    const first = location.start + (residue - 1) * 3 * step;
    const positions: [number, number, number] = [first, first + step, first + 2 * step];
    const bases = positions.map((position) => basesAt(segment, position, location.strand)).join('');
    return { positions, bases, residue: residueOf(bases) };
}

function basesAt(segment: string, position: number, strand: '+' | '-'): string {
    const base = segment[position - 1] ?? 'N';
    return strand === '+' ? base.toUpperCase() : reverseComplement(base) || 'N';
}

export function residueAt(
    locations: Iterable<GeneLocation>,
    segment: string,
    position: number,
): { location: GeneLocation; residue: number; offset: 1 | 2 | 3 }[] {
    const found: { location: GeneLocation; residue: number; offset: 1 | 2 | 3 }[] = [];
    for (const location of locations) {
        if (location.segment !== segment) {
            continue;
        }
        const distance = location.strand === '+' ? position - location.start : location.start - position;
        if (distance < 0 || distance >= location.length * 3) {
            continue;
        }
        found.push({
            location,
            residue: Math.floor(distance / 3) + 1,
            offset: ((distance % 3) + 1) as 1 | 2 | 3,
        });
    }
    return found;
}

export type GenomeMap = { segments: { name: string; length: number; offset: number }[]; length: number };

export function genomeMapOf(segments: ReadonlyMap<string, string>): GenomeMap {
    let offset = 0;
    const laid = [...segments.entries()].map(([name, sequence]) => {
        const entry = { name, length: sequence.length, offset };
        offset += sequence.length;
        return entry;
    });
    return { segments: laid, length: offset };
}
