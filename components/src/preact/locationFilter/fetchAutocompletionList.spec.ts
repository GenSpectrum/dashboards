import { describe, expect, test } from 'vitest';
import { DUMMY_LAPIS_URL, lapisRequestMocks } from '../../../vitest.setup';
import { fetchAutocompletionList } from './fetchAutocompletionList';

describe('fetchAutocompletionList', () => {
    test('should fetch autocompletion list', async () => {
        const fields = ['region', 'country', 'division'];

        const urlSearchParams = new URLSearchParams();
        urlSearchParams.append('fields', fields.join(','));
        lapisRequestMocks.aggregated(urlSearchParams, {
            data: [
                { count: 0, region: 'region1', country: 'country1_1', division: 'division1_1_1' },
                { count: 0, region: 'region1', country: 'country1_1', division: 'division1_1_2' },
                { count: 0, region: 'region1', country: 'country1_1', division: null },
                { count: 0, region: 'region1', country: 'country1_2', division: 'division1_2_1' },
                { count: 0, region: 'region2', country: 'country2_1', division: null },
            ],
        });

        const result = await fetchAutocompletionList(fields, DUMMY_LAPIS_URL);

        expect(result).to.deep.equal([
            { region: 'region1', country: null, division: null },
            { region: 'region1', country: 'country1_1', division: null },
            { region: 'region1', country: 'country1_1', division: 'division1_1_1' },
            { region: 'region1', country: 'country1_1', division: 'division1_1_2' },
            { region: 'region1', country: 'country1_2', division: null },
            { region: 'region1', country: 'country1_2', division: 'division1_2_1' },
            { region: 'region2', country: null, division: null },
            { region: 'region2', country: 'country2_1', division: null },
        ]);
    });
});
