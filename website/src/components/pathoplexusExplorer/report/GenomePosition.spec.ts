import { describe, expect, test } from 'vitest';

import {
    axisTicks,
    geneNames,
    geneRows,
    genesOnGenome,
    labelLayout,
    roundStep,
    rulerLabels,
    type GeneBlock,
    type LaidLabel,
} from './GenomePosition.tsx';
import type { Genome } from '../../../pathoplexusExplorer/dataLayer/hooks/useGenome.ts';
import type { GeneLocation, GenomeMap } from '../../../pathoplexusExplorer/domain/genes.ts';

const WIDTH = 680;

const SINGLE: GenomeMap = { segments: [{ name: 'main', length: 15000, offset: 0 }], length: 15000 };
const SEGMENTED: GenomeMap = {
    segments: [
        { name: 'L', length: 12000, offset: 0 },
        { name: 'M', length: 5000, offset: 12000 },
        { name: 'S', length: 1600, offset: 17000 },
    ],
    length: 18600,
};

/** Labels must preserve the order of their marks. */
function crossings(labels: readonly LaidLabel[]): number {
    return labels.filter((entry, index) => index > 0 && entry.labelX < labels[index - 1].labelX).length;
}

function lead(labels: readonly LaidLabel[]): number {
    return Math.max(...labels.map((entry) => Math.abs(entry.labelX - entry.x)));
}

function overlaps(labels: readonly LaidLabel[]): number {
    return labels.filter((entry, index) => {
        const before = labels[index - 1];
        return index > 0 && before.row === entry.row && entry.labelX - before.labelX < 20;
    }).length;
}

describe('the labels of the genome ruler', () => {
    test('stand in the order of their marks, whatever order the query named them in', () => {
        const { labels } = rulerLabels(
            [
                { offset: 6000, label: 'N:V352A' },
                { offset: 13000, label: 'M2-1:S176P' },
                { offset: 9000, label: 'G:S243I' },
            ],
            SINGLE,
            WIDTH,
        );
        expect(labels.map((entry) => entry.label)).toEqual(['N:V352A', 'G:S243I', 'M2-1:S176P']);
        expect(crossings(labels)).toBe(0);
        expect(labels.every((entry) => entry.labelX === entry.x)).toBe(true);
    });

    test('are drawn inside the figure, at both ends of the genome', () => {
        const { labels } = rulerLabels(
            [
                { offset: 0, label: 'L:M1T' },
                { offset: 18599, label: 'S:N482K' },
            ],
            SEGMENTED,
            WIDTH,
        );
        expect(labels[0].labelX).toBeGreaterThan(0);
        expect(labels[1].labelX).toBeLessThan(WIDTH);
        expect(crossings(labels)).toBe(0);
    });

    test('make room for each other rather than printing on top of each other', () => {
        const marks = Array.from({ length: 6 }, (_, index) => ({
            offset: 7000 + index * 40,
            label: `M2-1:S${index}00P`,
        }));
        const { labels, rows } = rulerLabels(marks, SINGLE, WIDTH);
        expect(rows).toBe(2);
        expect(crossings(labels)).toBe(0);
        expect(overlaps(labels)).toBe(0);
        const onOneLine = labelLayout(
            marks.map((mark) => ({ label: mark.label, x: (mark.offset / SINGLE.length) * WIDTH })),
            WIDTH,
            1,
        );
        expect(lead(labels)).toBeLessThan(lead(onOneLine));
        expect(lead(labels)).toBeLessThan(WIDTH / 4);
    });

    test('are still ordered where two mutations sit at the same base', () => {
        const { labels } = rulerLabels(
            [
                { offset: 4000, label: 'F:S190N' },
                { offset: 4000, label: 'F:S190T' },
            ],
            SINGLE,
            WIDTH,
        );
        expect(crossings(labels)).toBe(0);
        expect(overlaps(labels)).toBe(0);
    });

    test('more labels than the figure has room for are squeezed rather than run off the edge', () => {
        const marks = Array.from({ length: 40 }, (_, index) => ({
            offset: index * 370,
            label: `M2-1:S${index}00P`,
        }));
        const { labels } = rulerLabels(marks, SINGLE, WIDTH);
        expect(crossings(labels)).toBe(0);
        expect(Math.min(...labels.map((entry) => entry.labelX))).toBeGreaterThan(0);
        expect(Math.max(...labels.map((entry) => entry.labelX))).toBeLessThan(WIDTH);
    });

    test('a single mark is drawn over its own position', () => {
        const { labels, rows } = rulerLabels([{ offset: 7500, label: 'F:S190N' }], SINGLE, WIDTH);
        expect(rows).toBe(1);
        expect(labels[0].labelX).toBeCloseTo(WIDTH / 2, 5);
    });
});

function genomeOf(map: GenomeMap, genes: readonly GeneLocation[]): Genome {
    return {
        segments: new Map(map.segments.map((segment) => [segment.name, 'A'.repeat(segment.length)])),
        proteins: new Map(),
        genes: new Map(genes.map((gene) => [gene.gene, gene])),
        repeatedGenes: new Set(),
        map,
    };
}

function block(gene: string, from: number, to: number, marked = false): GeneBlock {
    return { gene, from, to, strand: '+', marked };
}

describe('the genes drawn on the ruler', () => {
    test('a gene on the minus strand runs back from the base its first codon starts at', () => {
        const genome = genomeOf(SINGLE, [
            { gene: 'forward', segment: 'main', strand: '+', start: 100, length: 10 },
            { gene: 'backward', segment: 'main', strand: '-', start: 500, length: 10 },
        ]);
        expect(genesOnGenome(genome, [])).toEqual([
            { gene: 'forward', from: 99, to: 128, strand: '+', marked: false },
            { gene: 'backward', from: 470, to: 499, strand: '-', marked: false },
        ]);
    });

    test('a gene on the second segment is drawn past the first', () => {
        const genome = genomeOf(SEGMENTED, [{ gene: 'GPC', segment: 'M', strand: '+', start: 1, length: 4 }]);
        expect(genesOnGenome(genome, [])[0]).toMatchObject({ from: 12000, to: 12011 });
    });

    test('the gene a selected position falls in is the one marked', () => {
        const genome = genomeOf(SINGLE, [
            { gene: 'N', segment: 'main', strand: '+', start: 1000, length: 100 },
            { gene: 'P', segment: 'main', strand: '+', start: 2000, length: 100 },
        ]);
        expect(genesOnGenome(genome, [1100]).map((gene) => gene.marked)).toEqual([true, false]);
    });

    test('genes that lie end to end share a row, and a gene inside another drops below it', () => {
        const rows = geneRows([
            block('NS1', 0, 400),
            block('NS2', 500, 900),
            block('M2-1', 7000, 7600),
            block('M2-2', 7580, 7800),
        ]);
        expect(rows.map((row) => row.map((gene) => gene.gene))).toEqual([['NS1', 'NS2', 'M2-1'], ['M2-2']]);
    });

    test('the names of the blocks too narrow to hold them are written out, where they fit on one line', () => {
        const narrow = [
            { ...block('NS1', 0, 400), x: 0, width: 18, row: 0, named: false },
            { ...block('SH', 4000, 4200), x: 180, width: 9, row: 0, named: false },
        ];
        expect(geneNames(narrow, 680).map((name) => name.label)).toEqual(['NS1', 'SH']);
        const many = Array.from({ length: 200 }, (_, index) => ({
            ...block(`OPG${index}`, index * 900, index * 900 + 800),
            x: index * 3.4,
            width: 3,
            row: 0,
            named: false,
        }));
        expect(geneNames(many, 680)).toEqual([]);
    });

    test('a name is never written for a block that already carries it', () => {
        const wide = [{ ...block('NS1', 0, 4000), x: 0, width: 180, row: 0, named: true }];
        expect(geneNames(wide, 680)).toEqual([]);
    });
});

describe('the numbers along the foot of the figure', () => {
    test('are round ones a reader counts in', () => {
        expect([roundStep(1), roundStep(1100), roundStep(1600), roundStep(4000)]).toEqual([1, 2000, 2000, 5000]);
    });

    test('run from 1 to the last base of a single sequence', () => {
        const ticks = axisTicks(SINGLE, WIDTH);
        expect(ticks[0]).toMatchObject({ label: '1', x: 0 });
        expect(ticks[ticks.length - 1]).toMatchObject({ label: '15,000', x: WIDTH });
        expect(ticks.map((tick) => tick.label)).toEqual([
            '1',
            '2,000',
            '4,000',
            '6,000',
            '8,000',
            '10,000',
            '12,000',
            '15,000',
        ]);
    });

    test('number every segment from its own first base, as a mutation on it is written', () => {
        const ticks = axisTicks(SEGMENTED, WIDTH);
        expect(ticks.filter((tick) => tick.label === '1')).toHaveLength(3);
        expect(ticks.map((tick) => tick.label)).toContain('12,000');
        expect(ticks.map((tick) => tick.label)).toContain('5,000');
        expect(ticks.map((tick) => tick.label)).toContain('1,600');
    });

    test('a segment too narrow for both of its ends carries its first base alone', () => {
        const slivers: GenomeMap = {
            segments: [
                { name: 'long', length: 60000, offset: 0 },
                { name: 'short', length: 300, offset: 60000 },
            ],
            length: 60300,
        };
        const ticks = axisTicks(slivers, WIDTH).filter((tick) => tick.x >= (60000 / 60300) * WIDTH);
        expect(ticks.map((tick) => tick.label)).toEqual(['60,000', '1']);
    });

    test('stand in the order of the genome, however the segments divide it', () => {
        const ticks = axisTicks(SEGMENTED, WIDTH);
        expect(ticks.every((tick, index) => index === 0 || tick.x >= ticks[index - 1].x)).toBe(true);
        expect(Math.max(...ticks.map((tick) => tick.x))).toBeLessThanOrEqual(WIDTH);
    });
});
