import { describe, expect, test } from 'vitest';

import { wastewaterOrganismConfigs } from './wastewaterConfig';

describe.each(Object.entries(wastewaterOrganismConfigs))('wastewaterConfig %s', (_configName, config) => {
    test('default resistance set name is valid', () => {
        if (config.resistanceAnalysisModeEnabled) {
            const resistanceSetNames = config.resistanceMutationSets.map((s) => s.name);
            const defaultSetName = config.filterDefaults.resistance.resistanceSet;
            expect(resistanceSetNames).include(defaultSetName);
        }
    });
});
