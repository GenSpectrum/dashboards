import type { FC, ReactNode } from 'react';

import { formatCount, formatProportion } from '../../../pathoplexusExplorer/domain/statistics.ts';

type MastheadProps = {
    title: string;
    kind: string;
    scope: string;
    written: string;
    children?: ReactNode;
};

export const Masthead: FC<MastheadProps> = ({ title, kind, scope, written, children }) => {
    return (
        <header className='flex flex-col gap-2 border-b-2 border-stone-800 pb-3'>
            <div className='flex flex-wrap items-baseline justify-between gap-2'>
                <span className='report-note font-semibold tracking-[0.12em] text-stone-500 uppercase'>{kind}</span>
                <span className='report-note text-stone-500'>Generated on {written}</span>
            </div>
            <h1 className='text-3xl leading-tight font-bold'>{title}</h1>
            <p className='report-note font-semibold text-stone-700'>{scope}</p>
            {children}
        </header>
    );
};

type SourceNoteProps = { href: string };

/** Print the report URL so readers can return to its data and filters. */
export const SourceNote: FC<SourceNoteProps> = ({ href }) => {
    return (
        <footer className='report-note border-t border-stone-300 pt-2 text-stone-500'>
            This report was generated from{' '}
            <a href={href} className='break-all underline underline-offset-2'>
                {href}
            </a>
            .
        </footer>
    );
};

type SectionProps = {
    number: number;
    title: string;
    lead?: ReactNode;
    children: ReactNode;
};

export const Section: FC<SectionProps> = ({ number, title, lead, children }) => {
    return (
        <section className='report-section flex flex-col gap-3'>
            <h2 className='border-b border-stone-300 pb-1 text-lg font-bold'>
                <span className='mr-2 text-stone-400 tabular-nums'>{number}</span>
                {title}
            </h2>
            {lead !== undefined && <Prose>{lead}</Prose>}
            {children}
        </section>
    );
};

type SubsectionProps = { title: string; children: ReactNode };

export const Subsection: FC<SubsectionProps> = ({ title, children }) => {
    return (
        <section className='flex flex-col gap-1'>
            <h3 className='report-note font-semibold tracking-wider text-stone-500 uppercase'>{title}</h3>
            {children}
        </section>
    );
};

type ProseProps = { children: ReactNode };

export const Prose: FC<ProseProps> = ({ children }) => {
    return <p className='report-body leading-relaxed text-stone-800'>{children}</p>;
};

type ReportLinkProps = { href?: string; muted?: boolean; children: ReactNode };

export const ReportLink: FC<ReportLinkProps> = ({ href, muted = false, children }) => {
    return href === undefined ? (
        <span className={muted ? 'text-stone-500' : undefined}>{children}</span>
    ) : (
        <a href={href} className='text-primary underline underline-offset-2'>
            {children}
        </a>
    );
};

type OutboundLinkProps = { href: string; children: ReactNode };

/** Include the destination when printing an external link. */
export const OutboundLink: FC<OutboundLinkProps> = ({ href, children }) => {
    return (
        <a
            href={href}
            data-href={href}
            target='_blank'
            rel='noreferrer'
            className='text-primary underline underline-offset-2'
        >
            {children}
        </a>
    );
};

type FigureProps = { title?: string; caption?: ReactNode; children: ReactNode };

export const Figure: FC<FigureProps> = ({ title, caption, children }) => {
    return (
        <figure className='report-figure flex flex-col gap-1'>
            {title !== undefined && (
                <figcaption className='report-note font-semibold tracking-wider text-stone-500 uppercase'>
                    {title}
                </figcaption>
            )}
            {children}
            {caption !== undefined && <figcaption className='report-note text-stone-600'>{caption}</figcaption>}
        </figure>
    );
};

type KeyFigure = { label: string; value: string; note?: string };

type KeyFiguresProps = { figures: readonly KeyFigure[] };

export const KeyFigures: FC<KeyFiguresProps> = ({ figures }) => {
    return (
        <dl className='report-figure grid grid-cols-2 gap-x-4 gap-y-3 border-y border-stone-200 py-3 sm:grid-cols-4'>
            {figures.map((figure) => (
                <div key={figure.label} className='flex flex-col'>
                    <dt className='report-label font-semibold text-stone-500 uppercase'>{figure.label}</dt>
                    <dd className='text-xl leading-tight font-bold tabular-nums'>{figure.value}</dd>
                    {figure.note !== undefined && <dd className='report-note text-stone-600'>{figure.note}</dd>}
                </div>
            ))}
        </dl>
    );
};

export type Column<Row> = {
    header: string;
    align?: 'left' | 'right';
    width?: string;
    cell: (row: Row) => ReactNode;
};

export function frequencyColumns<Row extends { n: number }>(total: number): Column<Row>[] {
    return [
        { header: 'Sequences', align: 'right', width: 'w-24', cell: (row) => formatCount(row.n) },
        {
            header: 'Proportion',
            align: 'right',
            width: 'w-20',
            cell: (row) => (total === 0 ? '—' : formatProportion(row.n / total)),
        },
    ];
}

type TableProps<Row> = {
    columns: readonly Column<Row>[];
    rows: readonly Row[];
    keyOf: (row: Row) => string;
    footnote?: ReactNode;
};

export function Table<Row>({ columns, rows, keyOf, footnote }: TableProps<Row>) {
    return (
        <div className='report-table flex flex-col gap-1'>
            <table className='report-small w-full'>
                <thead>
                    <tr className='border-b border-stone-300 text-stone-600'>
                        {columns.map((column) => (
                            <th
                                key={column.header}
                                className={`py-1 pr-2 font-semibold last:pr-0 ${column.align === 'right' ? 'text-right' : 'text-left'} ${column.width ?? ''}`}
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 && (
                        <tr className='border-b border-stone-100'>
                            <td className='py-1 text-stone-500' colSpan={columns.length}>
                                Nothing.
                            </td>
                        </tr>
                    )}
                    {rows.map((row) => (
                        <tr key={keyOf(row)} className='border-b border-stone-100'>
                            {columns.map((column) => (
                                <td
                                    key={column.header}
                                    className={`py-1 pr-2 last:pr-0 ${column.align === 'right' ? 'text-right tabular-nums' : ''}`}
                                >
                                    {column.cell(row)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {footnote !== undefined && <p className='report-note text-stone-600'>{footnote}</p>}
        </div>
    );
}

type BarProps = { value: number | undefined; of: number; color?: string };

/** Draw the rank bar as SVG so it appears in print. */
export const Bar: FC<BarProps> = ({ value, of, color = '#2a78d6' }) => {
    const proportion =
        value === undefined || of === 0 || value === 0 ? 0 : Math.max(1, Math.min(100, (value / of) * 100));
    return (
        <svg aria-hidden width='100%' height={10} className='block'>
            <rect x={0} y={0} width='100%' height={10} fill='#f0efec' />
            {proportion > 0 && <rect x={0} y={0} width={`${proportion}%`} height={10} fill={color} />}
        </svg>
    );
};

type LegendItem = { label: string; color: string; shape?: 'box' | 'line' | 'band' };

type ChartLegendProps = { items: readonly LegendItem[]; note?: ReactNode };

/** Include a printed legend because tooltips are unavailable on paper. */
export const ChartLegend: FC<ChartLegendProps> = ({ items, note }) => {
    return (
        <div className='flex flex-col gap-1'>
            <ul className='report-note flex flex-wrap gap-x-3 gap-y-1 text-stone-700'>
                {items.map((item) => (
                    <li key={item.label} className='flex items-center gap-1'>
                        <Swatch item={item} />
                        <span>{item.label}</span>
                    </li>
                ))}
            </ul>
            {note !== undefined && <p className='report-note text-stone-600'>{note}</p>}
        </div>
    );
};

type SwatchProps = { item: LegendItem };

/** Draw the legend marker as SVG so it appears in print. */
const Swatch: FC<SwatchProps> = ({ item }) => {
    const shape = item.shape ?? 'box';
    const height = shape === 'line' ? 2 : 10;
    const opacity = shape === 'band' ? 0.25 : 1;
    return (
        <svg aria-hidden width={16} height={10} viewBox='0 0 16 10' className='shrink-0'>
            <rect x={0} y={(10 - height) / 2} width={16} height={height} fill={item.color} opacity={opacity} />
        </svg>
    );
};

export function withRest<Row>(rows: readonly Row[], limit: number, rest: (left: readonly Row[]) => Row): Row[] {
    if (rows.length <= limit) {
        return [...rows];
    }
    return [...rows.slice(0, limit), rest(rows.slice(limit))];
}

export function restLabel(count: number, singular: string, plural: string): string {
    return `${formatCount(count)} further ${count === 1 ? singular : plural}`;
}
