import type { FC } from 'react';

import { Bar, frequencyColumns, ReportLink, restLabel, Subsection, Table } from './Layout.tsx';
import type { Loadable } from '../../../pathoplexusExplorer/dataLayer/hooks/queryResult.ts';
import { CREDITS_SHOWN, type RankedValues } from '../../../pathoplexusExplorer/dataLayer/hooks/useReportData.ts';
import { COLUMNS } from '../../../pathoplexusExplorer/dataLayer/queries/columns.ts';
import { readOptionalText, type RhydbRow } from '../../../pathoplexusExplorer/dataLayer/transport/row.ts';
import { sumOf } from '../../../pathoplexusExplorer/domain/statistics.ts';
import { Async } from '../ui/States.tsx';
import { OTHER_COLOR } from '../ui/colors.ts';

type SubmittersProps = {
    groups: Loadable<RhydbRow[]>;
    authors: Loadable<RankedValues>;
    affiliations: Loadable<RankedValues>;
};

export const Submitters: FC<SubmittersProps> = ({ groups, authors, affiliations }) => {
    return (
        <>
            <Subsection title='Submitting groups'>
                <Async state={groups} height='h-24'>
                    {(rows) => {
                        const entries = groupsOf(rows);
                        return (
                            <CreditTable
                                entries={entries}
                                total={sumOf(entries, (entry) => entry.n)}
                                values={entries.length}
                                heading='Submitting group'
                                singular='group'
                                plural='groups'
                                shown={SHOWN_GROUPS}
                            />
                        );
                    }}
                </Async>
            </Subsection>
            <Subsection title='Author affiliations'>
                <RankedCredits
                    state={affiliations}
                    column={COLUMNS.affiliations}
                    heading='Affiliations'
                    singular='affiliation'
                    plural='affiliations'
                />
            </Subsection>
            <Subsection title='Authors'>
                <RankedCredits
                    state={authors}
                    column={COLUMNS.authors}
                    heading='Authors'
                    singular='author list'
                    plural='author lists'
                />
            </Subsection>
        </>
    );
};

const SHOWN_GROUPS = 8;

type CreditRow = {
    label: string;
    n: number;
    rest?: boolean;
};

type CreditTableProps = {
    entries: CreditRow[];
    values: number;
    total: number;
    heading: string;
    singular: string;
    plural: string;
    shown?: number;
};

type RankedCreditsProps = Pick<CreditTableProps, 'heading' | 'singular' | 'plural'> & {
    state: Loadable<RankedValues>;
    column: string;
};

const RankedCredits: FC<RankedCreditsProps> = ({ state, column, ...labels }) => (
    <Async state={state} height='h-24'>
        {({ rows, values, total }) => (
            <CreditTable {...labels} entries={creditRows(rows, column)} values={values} total={total} />
        )}
    </Async>
);

const CreditTable: FC<CreditTableProps> = ({
    entries,
    values,
    total,
    heading,
    singular,
    plural,
    shown = CREDITS_SHOWN,
}) => {
    const printed = entries.slice(0, shown);
    const top = Math.max(1, ...printed.map((entry) => entry.n));
    const left = values - printed.length;
    if (left > 0) {
        printed.push({
            label: restLabel(left, singular, plural),
            n: total - sumOf(printed, (entry) => entry.n),
            rest: true,
        });
    }
    return (
        <Table
            columns={[
                { header: heading, cell: (row) => <ReportLink muted={row.rest === true}>{row.label}</ReportLink> },
                ...frequencyColumns<CreditRow>(total),
                {
                    header: '',
                    width: 'w-32',
                    cell: (row) => <Bar value={row.n} of={top} color={row.rest === true ? OTHER_COLOR : undefined} />,
                },
            ]}
            rows={printed}
            keyOf={(row) => row.label}
        />
    );
};

/** Group by the complete credit field as recorded, including full author lists. */
function creditRows(rows: readonly RhydbRow[], column: string): CreditRow[] {
    return rows
        .map((row) => ({ label: readOptionalText(row, column) ?? 'Not recorded', n: Number(row.n ?? 0) }))
        .filter((entry) => entry.n > 0)
        .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
}

/** Group submitters by ID because registered groups can share a name. */
function groupsOf(rows: readonly RhydbRow[]): CreditRow[] {
    const groups = new Map<string, { name: string | null; n: number }>();
    for (const row of rows) {
        const id = (row[COLUMNS.group] ?? null) as string | number | null;
        const key = id === null ? '' : String(id);
        const entry = groups.get(key) ?? { name: (row[COLUMNS.groupName] ?? null) as string | null, n: 0 };
        entry.n += Number(row.n ?? 0);
        groups.set(key, entry);
    }
    const groupsPerName = new Map<string, number>();
    for (const { name } of groups.values()) {
        if (name !== null) {
            groupsPerName.set(name, (groupsPerName.get(name) ?? 0) + 1);
        }
    }
    return [...groups.entries()]
        .filter(([, entry]) => entry.n > 0)
        .map(([key, entry]) => ({
            label:
                entry.name === null
                    ? 'Not recorded'
                    : (groupsPerName.get(entry.name) ?? 0) > 1
                      ? `${entry.name} (group ${key})`
                      : entry.name,
            n: entry.n,
        }))
        .sort((a, b) => b.n - a.n);
}
