import type { FC } from 'react';

import { Bar, ReportLink, restLabel, Table } from './Layout.tsx';
import { exactName, type BreakdownSpec, type Part } from '../../../pathoplexusExplorer/dataLayer/queries/breakdown.ts';
import { formatCount, formatProportion, sumOf } from '../../../pathoplexusExplorer/domain/statistics.ts';
import type { Subject } from '../../../pathoplexusExplorer/domain/subject.ts';
import { capitalized } from '../../../pathoplexusExplorer/domain/text.ts';
import { Loading } from '../ui/States.tsx';
import { OTHER_COLOR } from '../ui/colors.ts';

export type TreeEntry = { label: string; href?: string };

export type TreeRow = {
    key: string;
    depth: number;
    label: string;
    href?: string;
    /** With `nested`, the count includes descendants. */
    n?: number;
    subject?: boolean;
    rest?: boolean;
    nested?: boolean;
};

const SHOWN_BRANCHES = 10;

type LineageTreeProps = {
    rows: readonly TreeRow[] | undefined;
    total: number | undefined;
    title: string;
};

export const LineageTree: FC<LineageTreeProps> = ({ rows, total, title }) => {
    if (rows === undefined || total === undefined) {
        return <Loading height='h-32' />;
    }
    const top = Math.max(1, ...rows.map((row) => row.n ?? 0));
    const nested = rows.some((row) => row.nested === true);
    return (
        <Table
            footnote={nested ? `* Sub-${lastWord(title).toLowerCase()}s are included.` : undefined}
            columns={[
                {
                    header: capitalized(title),
                    cell: (row) => (
                        <span className='flex items-baseline gap-2' style={{ paddingLeft: row.depth * 14 }}>
                            {row.depth > 0 && <span className='text-stone-400'>└</span>}
                            <span className={row.subject === true ? 'font-semibold' : undefined}>
                                <ReportLink href={row.href} muted={row.rest}>
                                    {row.label}
                                </ReportLink>
                                {row.nested === true && '*'}
                            </span>
                        </span>
                    ),
                },
                {
                    header: 'Sequences',
                    align: 'right',
                    width: 'w-24',
                    cell: (row) => (row.n === undefined ? '' : formatCount(row.n)),
                },
                {
                    header: 'Proportion',
                    align: 'right',
                    width: 'w-20',
                    cell: (row) => (row.n === undefined || total === 0 ? '' : formatProportion(row.n / total)),
                },
                {
                    header: '',
                    width: 'w-40',
                    cell: (row) =>
                        row.n === undefined ? null : (
                            <Bar value={row.n} of={top} color={row.rest === true ? OTHER_COLOR : undefined} />
                        ),
                },
            ]}
            rows={rows}
            keyOf={(row) => row.key}
        />
    );
};

function lastWord(title: string): string {
    return title.slice(title.lastIndexOf(' ') + 1);
}

type RowsOptions = {
    ancestors?: readonly TreeEntry[];
    subject: TreeEntry;
    spec: BreakdownSpec | undefined;
    parts: readonly Part[];
    total: number | undefined;
    href: (what: Subject) => string | undefined;
    what: string;
    shown?: number;
};

export function classificationRows({
    ancestors = [],
    subject,
    spec,
    parts,
    total,
    href,
    what,
    shown = SHOWN_BRANCHES,
}: RowsOptions): TreeRow[] {
    const rows: TreeRow[] = ancestors.map((entry, depth) => ({
        key: `above:${entry.label}`,
        depth,
        label: entry.label,
        href: entry.href,
    }));
    const base = ancestors.length;
    const classification = spec?.of === 'classification';
    const through = classification ? spec.through : [];
    /** Count entries assigned directly to an ancestor separately from entries in its branches. */
    const own = new Map<string, number>();
    for (const part of parts) {
        const name = exactName(part.key);
        if (name !== undefined) {
            own.set(name, part.n);
        }
    }
    const named = new Set<string>([...(spec?.self === undefined ? [] : [spec.self]), ...through]);
    rows.push({
        key: 'subject',
        depth: base,
        label: subject.label,
        href: subject.href,
        subject: true,
        n: classification ? (spec.self === undefined ? undefined : own.get(spec.self)) : total,
    });
    if (!classification) {
        return rows;
    }
    for (const [index, name] of through.entries()) {
        const node = spec.target(name)?.what;
        rows.push({
            key: `through:${name}`,
            depth: base + 1 + index,
            label: name,
            href: node === undefined ? undefined : href(node),
            n: own.get(name),
        });
    }
    const depth = base + 1 + through.length;
    const branches = parts.filter((part) => {
        const name = exactName(part.key);
        return !part.residual && (name === undefined || !named.has(name));
    });
    for (const part of branches.slice(0, shown)) {
        const node = part.target?.what;
        rows.push({
            key: part.key,
            depth,
            label: part.label,
            href: node === undefined ? undefined : href(node),
            n: part.n,
            nested: spec.nested,
        });
    }
    const left = branches.slice(shown);
    if (left.length > 0) {
        rows.push({
            key: '(rest)',
            depth,
            label: restLabel(left.length, what, `${what}s`),
            n: sumOf(left, (part) => part.n),
            rest: true,
            nested: spec.nested,
        });
    }
    // Show unassigned entries without treating them as a child lineage.
    for (const part of parts.filter((part) => part.residual)) {
        rows.push({ key: part.key, depth: base + 1, label: part.label, n: part.n });
    }
    return rows;
}
