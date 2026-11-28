import type { FC, ReactNode } from 'react';

import { Bar, frequencyColumns, ReportLink, restLabel, Table, withRest } from './Layout.tsx';
import type { Part } from '../../../pathoplexusExplorer/dataLayer/queries/breakdown.ts';
import { sumOf } from '../../../pathoplexusExplorer/domain/statistics.ts';
import { capitalized } from '../../../pathoplexusExplorer/domain/text.ts';
import { OTHER_COLOR } from '../charts/colors.ts';
import { Loading } from '../ui/States.tsx';

const SHOWN = 10;

const REST_KEY = '(rest)';

type CompositionRow = { key: string; label: string; n: number; target?: Part['target'] };

type CompositionProps = {
    parts: readonly Part[] | undefined;
    total: number | undefined;
    caption?: ReactNode;
    what: string;
    linkOf?: (part: CompositionRow) => ReactNode;
};

export const Composition: FC<CompositionProps> = ({ parts, total, caption, what, linkOf }) => {
    if (parts === undefined || total === undefined) {
        return <Loading height='h-32' />;
    }
    // Keep the unassigned category separate from Other.
    const values = parts.filter((part) => !part.residual);
    const unplaced = parts.filter((part) => part.residual);
    const top = Math.max(1, ...parts.map((part) => part.n));
    const rows: CompositionRow[] = [
        ...withRest<CompositionRow>(values, SHOWN, (left) => ({
            key: REST_KEY,
            label: restLabel(left.length, what, `${what}s`),
            n: sumOf(left, (part) => part.n),
        })),
        ...unplaced,
    ];
    return (
        <Table
            columns={[
                {
                    header: capitalized(what),
                    cell: (row) =>
                        linkOf !== undefined && row.key !== REST_KEY ? (
                            linkOf(row)
                        ) : (
                            <ReportLink muted={row.key === REST_KEY}>{row.label}</ReportLink>
                        ),
                },
                ...frequencyColumns<CompositionRow>(total),
                {
                    header: '',
                    width: 'w-40',
                    cell: (row) => (
                        <Bar value={row.n} of={top} color={row.key === REST_KEY ? OTHER_COLOR : undefined} />
                    ),
                },
            ]}
            rows={rows}
            keyOf={(row) => row.key}
            footnote={caption}
        />
    );
};
