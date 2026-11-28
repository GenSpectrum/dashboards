import type { FC } from 'react';

import { frequencyColumns, Table } from './Layout.tsx';
import type { Loadable } from '../../../pathoplexusExplorer/dataLayer/hooks/queryResult.ts';
import { COLUMNS } from '../../../pathoplexusExplorer/dataLayer/queries/columns.ts';
import { readOptionalText, type RhydbRow } from '../../../pathoplexusExplorer/dataLayer/transport/row.ts';
import {
    HOST_GROUP,
    HOST_GROUP_LABELS,
    hostGroupOf,
    type HostGroup,
} from '../../../pathoplexusExplorer/domain/hosts.ts';
import { formatCount } from '../../../pathoplexusExplorer/domain/statistics.ts';
import { Async } from '../ui/States.tsx';

type HostsProps = { rows: Loadable<RhydbRow[]> };

const NAMED_HOSTS = 3;

const NAMED_GROUPS: readonly HostGroup[] = [HOST_GROUP.vector, HOST_GROUP.animal];

function hostLabel(group: HostGroup, names: ReadonlyMap<string, number>): string {
    const label = HOST_GROUP_LABELS[group];
    if (!NAMED_GROUPS.includes(group) || names.size === 0) {
        return label;
    }
    const top = [...names.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, NAMED_HOSTS)
        .map(([name, n]) => `${name} (${formatCount(n)})`);
    return `${label} (${top.join(', ')}${names.size > top.length ? ', \u2026' : ''})`;
}

type HostRow = { group: HostGroup; n: number; names: Map<string, number> };

export const Hosts: FC<HostsProps> = ({ rows }) => {
    return (
        <Async state={rows} height='h-24'>
            {(data) => {
                const counts = new Map<HostGroup, HostRow>();
                let total = 0;
                for (const row of data) {
                    const name = readOptionalText(row, COLUMNS.host);
                    const n = Number(row.n ?? 0);
                    const group = hostGroupOf(name, readOptionalText(row, COLUMNS.hostTaxon));
                    const entry = counts.get(group) ?? { group, n: 0, names: new Map<string, number>() };
                    total += n;
                    entry.n += n;
                    if (name !== null) {
                        entry.names.set(name, (entry.names.get(name) ?? 0) + n);
                    }
                    counts.set(group, entry);
                }
                return (
                    <Table
                        columns={[
                            { header: 'Host', cell: (row) => hostLabel(row.group, row.names) },
                            ...frequencyColumns<HostRow>(total),
                        ]}
                        rows={[...counts.values()].sort((a, b) => b.n - a.n)}
                        keyOf={(row) => row.group}
                    />
                );
            }}
        </Async>
    );
};
