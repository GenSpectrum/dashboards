import type { FC } from 'react';

import { Figure } from './Layout.tsx';
import type { Genome } from '../../../pathoplexusExplorer/dataLayer/hooks/useGenome.ts';
import type { PositionReading } from '../../../pathoplexusExplorer/dataLayer/hooks/useMutation.ts';
import { codonOf, type GeneLocation, type GenomeMap } from '../../../pathoplexusExplorer/domain/genes.ts';
import { formatCount } from '../../../pathoplexusExplorer/domain/statistics.ts';
import { UNEXPECTED_ERROR } from '../../../pathoplexusExplorer/domain/text.ts';
import { MUTATION_KIND, mutationLabel } from '../../../pathoplexusExplorer/domain/variant.ts';
import { useWidth } from '../charts/useWidth.ts';

const LABEL_LINE = 13;
const TOP_PAD = 8;
const BAR_HEIGHT = 16;
const PLAIN_BAR_HEIGHT = 9;
const GENE_ROW = 15;
const GENE_HEIGHT = 12;
const POINTED_WIDTH = 14;
const POINT = 4;
const TICK_ROW = 17;
const LABEL_GAP = 12;
const EDGE_PAD = 3;
const TICK_GAP = 72;
const MAX_LEAD = 24;
const MARK_COLOR = '#eb6834';
const SEGMENT_COLORS = ['#efede8', '#e4e1d9'];
const GENE_COLOR = '#cdc9bf';
const GENE_MARKED_COLOR = '#f6cdb6';

type GenomePositionProps = { genome: Genome; readings: readonly PositionReading[] };

export const GenomePosition: FC<GenomePositionProps> = ({ genome, readings }) => {
    const marks = readings.flatMap((reading) => {
        const placed = place(genome, reading);
        return placed === undefined ? [] : [{ reading, ...placed }];
    });
    const genes = genesOnGenome(
        genome,
        marks.map((mark) => mark.offset),
    );

    return (
        <Figure>
            <Ruler map={genome.map} marks={marks} genes={genes} />
        </Figure>
    );
};

export type GeneBlock = {
    gene: string;
    from: number;
    to: number;
    strand: '+' | '-';
    marked: boolean;
};

/** Draw reverse-strand genes from their last base. */
export function genesOnGenome(genome: Genome, marks: readonly number[]): GeneBlock[] {
    const blocks = [...genome.genes.values()].flatMap((location) => {
        const segment = genome.map.segments.find((entry) => entry.name === location.segment);
        if (segment === undefined) {
            return [];
        }
        const span = location.length * 3;
        const first = location.strand === '+' ? location.start : location.start - span + 1;
        const from = segment.offset + first - 1;
        const to = from + span - 1;
        return [
            {
                gene: location.gene,
                from,
                to,
                strand: location.strand,
                marked: marks.some((offset) => offset >= from && offset <= to),
            },
        ];
    });
    return blocks.sort((a, b) => a.from - b.from || a.to - b.to);
}

/** Place nonoverlapping genes in the same row. */
export function geneRows(blocks: readonly GeneBlock[]): GeneBlock[][] {
    const rows: GeneBlock[][] = [];
    for (const block of blocks) {
        const row = rows.find((entries) => entries[entries.length - 1].to < block.from);
        if (row === undefined) {
            rows.push([block]);
        } else {
            row.push(block);
        }
    }
    return rows;
}

export type AxisTick = { x: number; label: string; anchor: 'start' | 'middle' | 'end' };

function numberWidth(label: string): number {
    const thin = label.replace(/[^,]/g, '').length;
    return thin * 3 + (label.length - thin) * 6.2;
}

export function roundStep(wanted: number): number {
    const power = 10 ** Math.floor(Math.log10(Math.max(1, wanted)));
    return [1, 2, 5, 10].map((factor) => factor * power).find((step) => step >= wanted) ?? power * 10;
}

/** Restart the axis at the first base of each segment. */
export function axisTicks(map: GenomeMap, width: number): AxisTick[] {
    if (map.length === 0) {
        return [];
    }
    const scale = width / map.length;
    return map.segments.flatMap((segment) => {
        const left = segment.offset * scale;
        const right = left + segment.length * scale;
        const first: AxisTick = { x: left, label: '1', anchor: 'start' };
        const last: AxisTick = { x: right, label: formatCount(segment.length), anchor: 'end' };
        const ends = numberWidth(first.label) + numberWidth(last.label) + 12;
        const step = roundStep(TICK_GAP / scale);
        const within: AxisTick[] = [];
        for (let position = step; position < segment.length; position += step) {
            const x = left + position * scale;
            const label = formatCount(position);
            const half = numberWidth(label) / 2;
            if (x - half > left + numberWidth(first.label) + 18 && x + half < right - numberWidth(last.label) - 18) {
                within.push({ x, label, anchor: 'middle' });
            }
        }
        return right - left < ends ? [first] : [first, ...within, last];
    });
}

function geneLabelWidth(gene: string): number {
    const thin = gene.replace(/[^:.,-]/g, '').length;
    return thin * 4 + (gene.length - thin) * 7.6;
}

function geneShape(x: number, y: number, width: number, strand: '+' | '-'): string {
    const bottom = y + GENE_HEIGHT;
    const middle = y + GENE_HEIGHT / 2;
    if (width < POINTED_WIDTH) {
        return `M${x} ${y} H${x + width} V${bottom} H${x} Z`;
    }
    return strand === '+'
        ? `M${x} ${y} H${x + width - POINT} L${x + width} ${middle} L${x + width - POINT} ${bottom} H${x} Z`
        : `M${x + width} ${y} H${x + POINT} L${x} ${middle} L${x + POINT} ${bottom} H${x + width} Z`;
}

function place(genome: Genome, reading: PositionReading): { offset: number; label: string } | undefined {
    const mutation = reading.mutation;
    if (mutation.kind === MUTATION_KIND.nucleotide) {
        const segment = genome.map.segments.find((entry) => entry.name === mutation.sequence);
        return segment === undefined
            ? undefined
            : { offset: segment.offset + mutation.position - 1, label: labelOf(reading) };
    }
    const located = genome.genes.get(mutation.sequence);
    const sequence = located === undefined ? undefined : genome.segments.get(located.segment);
    if (located === undefined || sequence === undefined) {
        return undefined;
    }
    const codon = codonOf(located, mutation.position, sequence);
    const segment = genome.map.segments.find((entry) => entry.name === located.segment);
    return codon === undefined || segment === undefined
        ? undefined
        : { offset: segment.offset + Math.min(...codon.positions) - 1, label: labelOf(reading) };
}

/** Use the reference genome's symbol as the starting symbol in the label. */
function labelOf(reading: PositionReading): string {
    return mutationLabel({
        display: reading.display,
        from: reading.reference,
        position: reading.mutation.position,
        to: reading.mutation.to,
    });
}

type Mark = { offset: number; label: string };

type RulerProps = { map: GenomeMap; marks: readonly Mark[]; genes: readonly GeneBlock[] };

export type LaidLabel = { label: string; x: number; labelX: number; row: number };

/** Measure labels using the chart's font so spacing reflects the rendered text. */
function labelWidth(label: string): number {
    const narrow = label.replace(/[^:.,-]/g, '').length;
    return narrow * 3.8 + (label.length - narrow) * 7;
}

/** Keep labels in genomic order to avoid crossing their leader lines. */
export function labelLayout(marks: readonly { x: number; label: string }[], width: number, rows: number): LaidLabel[] {
    const half = marks.map((mark) => labelWidth(mark.label) / 2);
    const row = marks.map((_, index) => index % rows);
    const gap = (index: number) =>
        row[index - 1] === row[index]
            ? half[index - 1] + half[index] + LABEL_GAP
            : // Only the line drawn up to the label above has to clear the one below it.
              half[row[index] === 0 ? index : index - 1] + LABEL_GAP;
    const place = (from: number, to: number): number[] => {
        const within = [0];
        for (let index = from + 1; index <= to; index++) {
            within.push(within[within.length - 1] + gap(index));
        }
        const wanted = within.map((offset, index) => marks[from + index].x - offset);
        const middle = wanted.reduce((sum, value) => sum + value, 0) / wanted.length;
        const span = within[within.length - 1];
        const leftmost = half[from] + EDGE_PAD;
        const rightmost = width - half[to] - span - EDGE_PAD;
        if (rightmost < leftmost) {
            const room = Math.max(0, width - half[from] - half[to] - 2 * EDGE_PAD);
            return within.map((offset) => leftmost + (span === 0 ? 0 : (offset / span) * room));
        }
        return within.map((offset) => Math.min(Math.max(middle, leftmost), rightmost) + offset);
    };
    let runs = marks.map((_, index) => ({ from: index, to: index, at: place(index, index) }));
    for (let joined = true; joined;) {
        joined = false;
        for (let index = 0; index + 1 < runs.length; index++) {
            const left = runs[index];
            const right = runs[index + 1];
            if (right.at[0] - left.at[left.at.length - 1] < gap(right.from) - 0.001) {
                runs = [
                    ...runs.slice(0, index),
                    { from: left.from, to: right.to, at: place(left.from, right.to) },
                    ...runs.slice(index + 2),
                ];
                joined = true;
                break;
            }
        }
    }
    const at = runs.flatMap((run) => run.at);
    return marks.map((mark, index) => ({ label: mark.label, x: mark.x, labelX: at[index], row: row[index] }));
}

function longestLead(laid: readonly LaidLabel[]): number {
    return Math.max(0, ...laid.map((entry) => Math.abs(entry.labelX - entry.x)));
}

export function rulerLabels(
    marks: readonly Mark[],
    map: GenomeMap,
    width: number,
): { labels: LaidLabel[]; rows: number } {
    const placed = [...marks]
        .sort((a, b) => a.offset - b.offset)
        .map((mark) => ({ label: mark.label, x: (mark.offset / map.length) * width }));
    // Use a second label row only when it keeps labels closer to their marks.
    const single = labelLayout(placed, width, 1);
    const labels =
        placed.length < 2 || longestLead(single) <= MAX_LEAD
            ? single
            : [single, labelLayout(placed, width, 2)].reduce((a, b) => (longestLead(b) < longestLead(a) ? b : a));
    return { labels, rows: Math.max(1, ...labels.map((entry) => entry.row + 1)) };
} /** A gene as it is drawn: where its block stands, and whether the block can hold its name. */
type PlacedGene = GeneBlock & { x: number; width: number; row: number; named: boolean };

function placeGenes(genes: readonly GeneBlock[], scale: (offset: number) => number): PlacedGene[] {
    return geneRows(genes).flatMap((row, index) =>
        row.map((gene) => {
            const x = scale(gene.from);
            const width = Math.max(gene.marked ? 3 : 0.7, scale(gene.to + 1) - x);
            const point = width < POINTED_WIDTH ? 0 : POINT;
            return { ...gene, x, width, row: index, named: width - point - 4 >= geneLabelWidth(gene.gene) };
        }),
    );
}

/** List gene names below the track when they do not fit inside their blocks. */
export function geneNames(placed: readonly PlacedGene[], width: number): LaidLabel[] {
    const wanted = placed
        .filter((gene) => !gene.named)
        .sort((a, b) => a.x + a.width / 2 - (b.x + b.width / 2))
        .map((gene) => ({ label: gene.gene, x: gene.x + gene.width / 2 }));
    const needed = wanted.reduce((total, gene) => total + geneLabelWidth(gene.label) + LABEL_GAP, 0);
    return wanted.length === 0 || needed > width ? [] : labelLayout(wanted, width, 1);
}

/** Render at the measured width to keep letters legible. */
const Ruler: FC<RulerProps> = ({ map, marks, genes }) => {
    const [ref, width] = useWidth<HTMLDivElement>(680);
    if (map.length === 0) {
        return <p className='report-note text-stone-500'>The reference genome could not be read. {UNEXPECTED_ERROR}</p>;
    }
    const scale = (offset: number) => (offset / map.length) * width;
    const { labels: laid, rows } = rulerLabels(marks, map, width);
    const placed = placeGenes(genes, scale);
    const names = geneNames(placed, width);
    const placedBy = new Map(placed.map((gene) => [gene.gene, gene]));
    const geneTop = TOP_PAD + rows * LABEL_LINE;
    const geneRowCount = Math.max(0, ...placed.map((gene) => gene.row + 1));
    const namesY = geneTop + geneRowCount * GENE_ROW;
    const barY = namesY + (names.length === 0 ? 0 : LABEL_LINE);
    const barHeight = map.segments.length > 1 ? BAR_HEIGHT : PLAIN_BAR_HEIGHT;
    const axisY = barY + barHeight;
    const height = axisY + TICK_ROW;
    const baselineOf = (row: number) => geneTop - 6 - row * LABEL_LINE;
    return (
        <div ref={ref} className='w-full'>
            <svg width={width} height={height} role='img' aria-label='Position on the genome'>
                {map.segments.map((segment, index) => {
                    const x = scale(segment.offset);
                    const segmentWidth = Math.max(1, scale(segment.offset + segment.length) - x);
                    return (
                        <g key={segment.name}>
                            <rect
                                x={x}
                                y={barY}
                                width={segmentWidth}
                                height={barHeight}
                                fill={SEGMENT_COLORS[index % 2]}
                                stroke='#ffffff'
                                strokeWidth={0.5}
                            />
                            {map.segments.length > 1 && segmentWidth > 56 && (
                                <text
                                    x={x + segmentWidth / 2}
                                    y={barY + barHeight / 2 + 4}
                                    textAnchor='middle'
                                    className='chart-label fill-stone-700'
                                >
                                    {segment.name}
                                </text>
                            )}
                        </g>
                    );
                })}
                {laid.map((entry, index) => (
                    <line
                        key={`mark-${index}`}
                        x1={entry.x}
                        y1={geneTop - 4}
                        x2={entry.x}
                        y2={axisY + 4}
                        stroke={MARK_COLOR}
                        strokeWidth={2}
                    />
                ))}
                {placed.map((gene) => {
                    const y = geneTop + gene.row * GENE_ROW;
                    const point = gene.width < POINTED_WIDTH ? 0 : POINT;
                    return (
                        <g key={`${gene.gene}-${gene.from}`}>
                            <path
                                d={geneShape(gene.x, y, gene.width, gene.strand)}
                                fill={gene.marked ? GENE_MARKED_COLOR : GENE_COLOR}
                                stroke={gene.marked ? MARK_COLOR : '#ffffff'}
                                strokeWidth={gene.marked ? 1 : 0.6}
                            />
                            {gene.named && (
                                <text
                                    x={gene.x + (gene.width - point) / 2}
                                    y={y + GENE_HEIGHT - 3}
                                    textAnchor='middle'
                                    className='chart-label'
                                    fill={gene.marked ? '#9a3412' : '#44403b'}
                                >
                                    {gene.gene}
                                </text>
                            )}
                        </g>
                    );
                })}
                {names.map((name, index) => (
                    <g key={`name-${index}`}>
                        {Math.abs(name.labelX - name.x) > 1 && (
                            <line
                                x1={name.x}
                                y1={geneTop + (placedBy.get(name.label)?.row ?? 0) * GENE_ROW + GENE_HEIGHT}
                                x2={name.labelX}
                                y2={namesY + 1}
                                stroke='#a8a29d'
                                strokeWidth={0.8}
                            />
                        )}
                        <text
                            x={name.labelX}
                            y={namesY + LABEL_LINE - 4}
                            textAnchor='middle'
                            className='chart-label'
                            fill={placedBy.get(name.label)?.marked === true ? '#9a3412' : '#57534d'}
                        >
                            {name.label}
                        </text>
                    </g>
                ))}
                {laid.map((entry, index) => {
                    const baseline = baselineOf(entry.row);
                    return (
                        <g key={`${entry.label}-${index}`}>
                            {Math.abs(entry.labelX - entry.x) > 0.5 && (
                                <line
                                    x1={entry.x}
                                    y1={geneTop - 4}
                                    x2={entry.labelX}
                                    y2={baseline + 3}
                                    stroke={MARK_COLOR}
                                    strokeWidth={1}
                                />
                            )}
                            <text
                                x={entry.labelX}
                                y={baseline}
                                textAnchor='middle'
                                className='chart-label'
                                fill='#9a3412'
                            >
                                {entry.label}
                            </text>
                        </g>
                    );
                })}
                {axisTicks(map, width).map((tick, index) => (
                    <g key={`${tick.label}-${index}`}>
                        <line x1={tick.x} y1={axisY} x2={tick.x} y2={axisY + 4} stroke='#a8a29d' strokeWidth={1} />
                        <text
                            x={tick.x + (tick.anchor === 'start' ? 2 : tick.anchor === 'end' ? -2 : 0)}
                            y={axisY + TICK_ROW - 4}
                            textAnchor={tick.anchor}
                            className='chart-label fill-stone-500'
                        >
                            {tick.label}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
};

export type { GeneLocation };
