import type { FC, ReactNode } from 'react';

import { Bar, ReportLink, restLabel, Table, withRest } from './Layout.tsx';
import type { AreaCount, AreaScale } from '../../../pathoplexusExplorer/dataLayer/queries/areas.ts';
import type { Place } from '../../../pathoplexusExplorer/domain/geography.ts';
import type { Period } from '../../../pathoplexusExplorer/domain/scope.ts';
import { formatCount, formatProportion, LOW_COUNT, sumOf } from '../../../pathoplexusExplorer/domain/statistics.ts';
import { capitalized } from '../../../pathoplexusExplorer/domain/text.ts';
import { hrefOf } from '../../../pathoplexusExplorer/pageState/reportKinds.ts';
import { OTHER_COLOR } from '../charts/colors.ts';

type AreasTableProps = {
    scale: AreaScale;
    areas: readonly AreaCount[];
    period: Period;
    countHeader: string;
    ofHeader?: string;
    total?: number;
    footnote?: ReactNode;
    linkTo?: (place: Place) => string;
};

/** Report the count missing at the geographic level used by the table. */
export function unplacedNote(unplaced: number, total: number): ReactNode {
    if (unplaced <= 0) {
        return undefined;
    }
    return (
        <strong>
            {formatCount(unplaced)} {unplaced === 1 ? 'sequence is' : 'sequences are'} not in the table (
            {formatProportion(unplaced / Math.max(1, total))}).
        </strong>
    );
}

const SHOWN_AREAS = 12;

export const AreasTable: FC<AreasTableProps> = ({
    scale,
    areas,
    period,
    countHeader,
    ofHeader,
    total = 0,
    footnote,
    linkTo,
}) => {
    if (areas.length === 0 && footnote !== undefined) {
        return <p className='report-note text-stone-600'>{footnote}</p>;
    }
    const ofOwn = ofHeader !== undefined;
    const top = Math.max(1, ...areas.map((area) => area.own));
    return (
        <Table
            columns={[
                {
                    header: capitalized(scale.singular),
                    cell: (row) => (
                        <ReportLink
                            href={
                                row.place === undefined
                                    ? undefined
                                    : (linkTo?.(row.place) ?? hrefOf({ kind: 'location', where: row.place, period }))
                            }
                            muted
                        >
                            {row.name}
                        </ReportLink>
                    ),
                },
                { header: countHeader, align: 'right', width: 'w-24', cell: (row) => formatCount(row.own) },
                ...(ofOwn
                    ? [
                          {
                              header: ofHeader,
                              align: 'right' as const,
                              width: 'w-24',
                              cell: (row: AreaCount) => formatCount(row.all),
                          },
                      ]
                    : []),
                {
                    header: 'Proportion',
                    align: 'right',
                    width: 'w-20',
                    cell: (row) =>
                        ofOwn ? (
                            row.all < LOW_COUNT ? (
                                <span className='text-stone-400'>too few</span>
                            ) : (
                                formatProportion(row.own / row.all)
                            )
                        ) : total === 0 ? (
                            '—'
                        ) : (
                            formatProportion(row.own / total)
                        ),
                },
                {
                    header: '',
                    width: ofOwn ? 'w-24' : 'w-40',
                    cell: (row) =>
                        ofOwn ? (
                            <Bar value={row.all < LOW_COUNT ? undefined : row.own} of={Math.max(1, row.all)} />
                        ) : (
                            <Bar value={row.own} of={top} color={row.place === undefined ? OTHER_COLOR : undefined} />
                        ),
                },
            ]}
            rows={withRest(areas, SHOWN_AREAS, (left) => ({
                name: restLabel(left.length, scale.singular, scale.plural),
                own: sumOf(left, (entry) => entry.own),
                all: sumOf(left, (entry) => entry.all),
            }))}
            keyOf={(row) => row.name}
            footnote={footnote}
        />
    );
};
