import { beforeEach, describe, expect, test } from 'vitest';

import { getCladeLineages } from './getCladeLineages.ts';
import { DUMMY_LAPIS_URL } from '../../routeMocker.ts';
import { astroApiRouteMocker, lapisRouteMocker } from '../../vitest.setup.ts';

describe('getCladeLineages', () => {
    beforeEach(() => {
        astroApiRouteMocker.mockLog();
    });

    test('should return the lineage with max count for each clade', async () => {
        const cladeField = 'nextstrainClade';
        const lineageField = 'pangoLineage';

        lapisRouteMocker.mockPostAggregated(
            { fields: [cladeField, lineageField], orderBy: [cladeField, { field: 'count', type: 'descending' }] },
            {
                data: [
                    { count: 5, nextstrainClade: null, pangoLineage: 'XBB.1.16.3.3' },
                    { count: 9001, nextstrainClade: '23B', pangoLineage: 'XBB.1.16' },
                    { count: 681, nextstrainClade: '23B', pangoLineage: 'XBB.1.16.2' },
                    { count: 3055, nextstrainClade: '23B', pangoLineage: 'XBB.1.16.1' },
                    { count: 932, nextstrainClade: '23B', pangoLineage: 'FU.2' },
                    { count: 4797, nextstrainClade: '23B', pangoLineage: 'XBB.1.16.11' },
                    { count: 2000, nextstrainClade: '22A', pangoLineage: 'YAA.2' },
                    { count: 1500, nextstrainClade: '22A', pangoLineage: 'YAA.1' },
                ],
            },
        );

        const result = await getCladeLineages(DUMMY_LAPIS_URL, cladeField, lineageField);

        /* eslint-disable @typescript-eslint/naming-convention */
        expect(result).toEqual({
            '23B': 'XBB.1.16',
            '22A': 'YAA.2',
        });
        /* eslint-enable @typescript-eslint/naming-convention */
    });

    test('should throw on failed request', async () => {
        const cladeField = 'nextstrainClade';
        const lineageField = 'pangoLineage';

        lapisRouteMocker.mockPostAggregated(
            { fields: [cladeField, lineageField], orderBy: [cladeField, { field: 'count', type: 'descending' }] },
            { data: [] },
            500,
        );

        await expect(getCladeLineages(DUMMY_LAPIS_URL, cladeField, lineageField)).rejects.toThrow(
            /Failed to fetch clade lineages/,
        );
    });

    test('should throw on unexpected response shape', async () => {
        const cladeField = 'nextstrainClade';
        const lineageField = 'pangoLineage';

        lapisRouteMocker.mockPostAggregated(
            { fields: [cladeField, lineageField], orderBy: [cladeField, { field: 'count', type: 'descending' }] },
            // @ts-expect-error intentionally invalid
            { invalid: 'response' },
        );

        await expect(getCladeLineages(DUMMY_LAPIS_URL, cladeField, lineageField)).rejects.toThrow(
            /Failed to parse clade lineages response/,
        );
    });

    test('should throw on invalid response field types', async () => {
        const cladeField = 'nextstrainClade';
        const lineageField = 'pangoLineage';

        lapisRouteMocker.mockPostAggregated(
            { fields: [cladeField, lineageField], orderBy: [cladeField, { field: 'count', type: 'descending' }] },
            {
                data: [
                    { count: 10, nextstrainClade: '23B', pangoLineage: 'XBB.1' },
                    { count: 5, nextstrainClade: 23, pangoLineage: 'XBB.2' },
                    { count: 5, nextstrainClade: 123, pangoLineage: 'XBB.3' },
                ],
            },
        );

        await expect(getCladeLineages(DUMMY_LAPIS_URL, cladeField, lineageField)).rejects.toThrow(
            /Unexpected row types in clade lineages response/,
        );
    });
});
