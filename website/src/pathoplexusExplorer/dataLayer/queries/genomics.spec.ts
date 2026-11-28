import { expect, test } from 'vitest';

import { mutationProfileQuery } from './genomics.ts';

test('a mutation profile asks for the mutations above a proportion, with the fields that the table shows', () => {
    expect(
        mutationProfileQuery({
            tableName: 'mpox',
            filter: undefined,
            request: { kind: 'aminoAcid', minProportion: 0.9 },
        }).render(),
    ).toBe(
        "mpox.filter(versionStatus = 'LATEST_VERSION' && isRevocation = false)" +
            '.aminoAcidMutations(minProportion := 0.9, fields := {mutationFrom, mutationTo, sequenceName, position, proportion, coverage, count})',
    );
});
