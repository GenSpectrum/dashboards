import { describe, expect, it } from 'vitest';

import { WasapPageStateHandler } from './WasapPageStateHandler';
import { covidResistanceMutations } from '../../components/views/wasap/resistanceMutations';
import {
    VARIANT_TIME_FRAME,
    type WasapCollectionFilter,
    type WasapManualFilter,
    type WasapPageConfig,
    type WasapResistanceFilter,
    type WasapUntrackedFilter,
    type WasapVariantFilter,
} from '../../components/views/wasap/wasapPageConfig';

const config: WasapPageConfig = {
    name: 'SARS-CoV-2',
    path: `/wastewater/covid`,
    description: 'Analyze SARS-CoV-2 data that was collected by the WISE project.',
    linkTemplate: {
        nucleotideMutation:
            'https://open.cov-spectrum.org/explore/World/AllSamples/AllTimes/variants?nucMutations={{mutation}}',
        aminoAcidMutation:
            'https://open.cov-spectrum.org/explore/World/AllSamples/AllTimes/variants?aaMutations={{mutation}}',
    },
    manualAnalysisModeEnabled: true,
    variantAnalysisModeEnabled: true,
    resistanceAnalysisModeEnabled: true,
    untrackedAnalysisModeEnabled: true,
    resistanceMutationSets: covidResistanceMutations,
    lapisBaseUrl: 'https://lapis.wasap.genspectrum.org',
    samplingDateField: 'samplingDate',
    locationNameField: 'locationName',
    clinicalLapis: {
        lapisBaseUrl: 'https://lapis.cov-spectrum.org/open/v2',
        cladeField: 'nextstrainClade',
        lineageField: 'nextcladePangoLineage',
        dateField: 'date',
    },
    browseDataUrl: 'https://db.wasap.genspectrum.org/covid/search',
    browseDataDescription: 'Browse the data in the W-ASAP Loculus instance.',
    defaultLocationName: 'Zürich (ZH)',
    clinicalSequenceCountWarningThreshold: 50,
    filterDefaults: {
        manual: {
            mode: 'manual',
            sequenceType: 'nucleotide',
            mutations: undefined,
        },
        variant: {
            mode: 'variant',
            sequenceType: 'nucleotide',
            variant: 'XFG*',
            minProportion: 0.8,
            minCount: 15,
            minJaccard: 0.75,
            timeFrame: VARIANT_TIME_FRAME.all,
        },
        resistance: {
            mode: 'resistance',
            sequenceType: 'amino acid',
            resistanceSet: '3CLpro',
        },
        untracked: {
            mode: 'untracked',
            sequenceType: 'nucleotide',
            excludeSet: 'predefined',
        },
    },
};

const configWithCollection: WasapPageConfig = {
    ...config,
    collectionAnalysisModeEnabled: true,
    collectionsApiBaseUrl: 'https://collections.example.org',
    collectionTitleFilter: 'test',
    filterDefaults: {
        ...config.filterDefaults,
        collection: {
            mode: 'collection',
            collectionId: undefined,
        },
    },
};

describe('WasapPageStateHandler', () => {
    const handler = new WasapPageStateHandler(config);

    describe('default URL', () => {
        it('should return the default page URL', () => {
            const url = handler.getDefaultPageUrl();
            expect(url).toBe('/wastewater/covid');
        });
    });

    describe('base filter', () => {
        it('parses base filter with all fields', () => {
            const url =
                '/wastewater/covid?' +
                'locationName=Berlin&' +
                'samplingDate=2024-01-01--2024-12-31&' +
                'granularity=week&' +
                'excludeEmpty=false&' +
                'analysisMode=manual&' +
                'sequenceType=nucleotide&';
            const filter = handler.parsePageStateFromUrl(new URL(`http://example.com${url}`));

            expect(filter.base.locationName).toBe('Berlin');
            expect(filter.base.samplingDate).toEqual({
                label: 'Custom',
                dateFrom: '2024-01-01',
                dateTo: '2024-12-31',
            });
            expect(filter.base.granularity).toBe('week');
            expect(filter.base.excludeEmpty).toBe(false);
        });

        it('defaults base filter fields when missing from URL', () => {
            const url = '/wastewater/covid?analysisMode=manual&sequenceType=nucleotide&';
            const filter = handler.parsePageStateFromUrl(new URL(`http://example.com${url}`));

            expect(filter.base.locationName).toBe('Zürich (ZH)');
            expect(filter.base.samplingDate).toBeUndefined();
            expect(filter.base.granularity).toBe('day');
            expect(filter.base.excludeEmpty).toBe(true);
        });

        it('encodes excludeEmpty=false in URL but omits when true', () => {
            const filterTrue = handler.parsePageStateFromUrl(
                new URL('http://example.com/wastewater/covid?analysisMode=manual&sequenceType=nucleotide&'),
            );
            const filterFalse = handler.parsePageStateFromUrl(
                new URL(
                    'http://example.com/wastewater/covid?analysisMode=manual&sequenceType=nucleotide&excludeEmpty=false&',
                ),
            );

            const urlTrue = handler.toUrl(filterTrue);
            const urlFalse = handler.toUrl(filterFalse);

            expect(urlTrue).not.toContain('excludeEmpty');
            expect(urlFalse).toContain('excludeEmpty=false');
        });

        it('parses excludeEmpty string "false" as boolean false', () => {
            const url = '/wastewater/covid?analysisMode=manual&sequenceType=nucleotide&excludeEmpty=false&';
            const filter = handler.parsePageStateFromUrl(new URL(`http://example.com${url}`));

            expect(typeof filter.base.excludeEmpty).toBe('boolean');
            expect(filter.base.excludeEmpty).toBe(false);
        });
    });

    describe('manual mode', () => {
        it('parses and encodes manual filter', () => {
            const url =
                '/wastewater/covid?' +
                'locationName=Z%C3%BCrich+%28ZH%29&' +
                'granularity=day&' +
                'analysisMode=manual&' +
                'sequenceType=nucleotide&';
            const filter = handler.parsePageStateFromUrl(new URL(`http://example.com${url}`));
            expect(filter.base.locationName).toBe('Zürich (ZH)');
            expect(filter.base.granularity).toBe('day');
            expect(filter.analysis.mode).toBe('manual');
            if (filter.analysis.mode === 'manual') {
                expect(filter.analysis.sequenceType).toBe('nucleotide');
            }

            const newUrl = handler.toUrl(filter);
            expect(newUrl).toBe(url);
        });

        it('parses manual mode with multiple mutations', () => {
            const url =
                '/wastewater/covid?' +
                'analysisMode=manual&' +
                'sequenceType=nucleotide&' +
                'mutations=A23T%7CS:E44H%7CORFla:T123A&';
            const filter = handler.parsePageStateFromUrl(new URL(`http://example.com${url}`));

            expect(filter.analysis.mode).toBe('manual');
            const analysis = filter.analysis as WasapManualFilter;
            expect(analysis.mutations).toEqual(['A23T', 'S:E44H', 'ORFla:T123A']);
        });

        it('manual mode with no mutations specified', () => {
            const url = '/wastewater/covid?analysisMode=manual&sequenceType=amino+acid&';
            const filter = handler.parsePageStateFromUrl(new URL(`http://example.com${url}`));

            expect(filter.analysis.mode).toBe('manual');
            const analysis = filter.analysis as WasapManualFilter;
            expect(analysis.sequenceType).toBe('amino acid');
            expect(analysis.mutations).toBeUndefined();
        });
    });

    describe('variant mode', () => {
        it('parses and encodes variant filter with all parameters', () => {
            const url =
                '/wastewater/covid?' +
                'locationName=Berlin&' +
                'granularity=week&' +
                'analysisMode=variant&' +
                'sequenceType=nucleotide&' +
                'variant=BA.2*&' +
                'minProportion=0.5&' +
                'minCount=10&' +
                'minJaccard=0.6&' +
                'timeFrame=3months&';
            const filter = handler.parsePageStateFromUrl(new URL(`http://example.com${url}`));

            expect(filter.analysis.mode).toBe('variant');
            const analysis = filter.analysis as WasapVariantFilter;
            expect(analysis.variant).toBe('BA.2*');
            expect(typeof analysis.minProportion).toBe('number');
            expect(analysis.minProportion).toBe(0.5);
            expect(typeof analysis.minCount).toBe('number');
            expect(analysis.minCount).toBe(10);
            expect(typeof analysis.minJaccard).toBe('number');
            expect(analysis.minJaccard).toBe(0.6);
            expect(analysis.timeFrame).toBe(VARIANT_TIME_FRAME.threeMonths);

            const newUrl = handler.toUrl(filter);
            expect(newUrl).toBe(url);
        });

        it('converts numeric string parameters to numbers', () => {
            const url =
                '/wastewater/covid?' +
                'analysisMode=variant&' +
                'minProportion=0.5&' +
                'minCount=10&' +
                'minJaccard=0.6&';
            const filter = handler.parsePageStateFromUrl(new URL(`http://example.com${url}`));

            const analysis = filter.analysis as WasapVariantFilter;
            expect(typeof analysis.minProportion).toBe('number');
            expect(typeof analysis.minCount).toBe('number');
            expect(typeof analysis.minJaccard).toBe('number');
        });

        it('variant mode round-trip preserves numeric precision', () => {
            const url =
                '/wastewater/covid?' + 'analysisMode=variant&' + 'minProportion=0.123456&' + 'minJaccard=0.789012&';
            const filter1 = handler.parsePageStateFromUrl(new URL(`http://example.com${url}`));
            const url2 = handler.toUrl(filter1);
            const filter2 = handler.parsePageStateFromUrl(new URL(`http://example.com${url2}`));

            const analysis1 = filter1.analysis as WasapVariantFilter;
            const analysis2 = filter2.analysis as WasapVariantFilter;
            expect(analysis2.minProportion).toBe(analysis1.minProportion);
            expect(analysis2.minJaccard).toBe(analysis1.minJaccard);
        });
    });

    describe('resistance mode', () => {
        it('parses and encodes resistance filter', () => {
            const url =
                '/wastewater/covid?' +
                'locationName=Z%C3%BCrich+%28ZH%29&' +
                'granularity=day&' +
                'analysisMode=resistance&' +
                'resistanceSet=3CLpro&';
            const filter = handler.parsePageStateFromUrl(new URL(`http://example.com${url}`));

            expect(filter.analysis.mode).toBe('resistance');
            const analysis = filter.analysis as WasapResistanceFilter;
            expect(analysis.resistanceSet).toBe('3CLpro');

            const newUrl = handler.toUrl(filter);
            expect(newUrl).toBe(url);
        });

        it('resistance mode always uses amino acid sequence type', () => {
            const url = '/wastewater/covid?analysisMode=resistance&resistanceSet=3CLpro&sequenceType=nucleotide&';
            const filter = handler.parsePageStateFromUrl(new URL(`http://example.com${url}`));

            expect(filter.analysis.mode).toBe('resistance');
            const analysis = filter.analysis as WasapResistanceFilter;
            expect(analysis.sequenceType).toBe('amino acid');
        });
    });

    describe('untracked mode', () => {
        it('parses and encodes untracked filter with predefined excludeSet', () => {
            const url =
                '/wastewater/covid?' +
                'locationName=Z%C3%BCrich+%28ZH%29&' +
                'granularity=day&' +
                'analysisMode=untracked&' +
                'sequenceType=nucleotide&' +
                'excludeSet=predefined&';
            const filter = handler.parsePageStateFromUrl(new URL(`http://example.com${url}`));

            expect(filter.analysis.mode).toBe('untracked');
            const analysis = filter.analysis as WasapUntrackedFilter;
            expect(analysis.excludeSet).toBe('predefined');
            expect(analysis.excludeVariants).toBeUndefined();

            const newUrl = handler.toUrl(filter);
            expect(newUrl).toBe(url);
        });

        it('parses and encodes untracked filter with custom excludeSet and variants', () => {
            const url =
                '/wastewater/covid?' +
                'locationName=Z%C3%BCrich+%28ZH%29&' +
                'granularity=day&' +
                'analysisMode=untracked&' +
                'sequenceType=nucleotide&' +
                'excludeSet=custom&' +
                'excludeVariants=XBB.1.5*%7CBA.2*%7CJN.1&';
            const filter = handler.parsePageStateFromUrl(new URL(`http://example.com${url}`));

            expect(filter.analysis.mode).toBe('untracked');
            const analysis = filter.analysis as WasapUntrackedFilter;
            expect(analysis.excludeSet).toBe('custom');
            expect(analysis.excludeVariants).toEqual(['XBB.1.5*', 'BA.2*', 'JN.1']);

            const newUrl = handler.toUrl(filter);
            expect(newUrl).toBe(url);
        });

        it('untracked mode round-trip with pipe-separated variants', () => {
            const url =
                '/wastewater/covid?' +
                'analysisMode=untracked&' +
                'sequenceType=nucleotide&' +
                'excludeSet=custom&' +
                'excludeVariants=XBB*%7CBA.2*%7CJN.1%7CXFG*&';
            const filter1 = handler.parsePageStateFromUrl(new URL(`http://example.com${url}`));
            const url2 = handler.toUrl(filter1);
            const filter2 = handler.parsePageStateFromUrl(new URL(`http://example.com${url2}`));

            const analysis1 = filter1.analysis as WasapUntrackedFilter;
            const analysis2 = filter2.analysis as WasapUntrackedFilter;
            expect(analysis2.excludeVariants).toEqual(analysis1.excludeVariants);
        });
    });

    describe('collection mode', () => {
        const handlerWithCollection = new WasapPageStateHandler(configWithCollection);

        it('throws error when feature is disabled', () => {
            const url = '/wastewater/covid?analysisMode=collection&collectionId=123&';
            expect(() => handler.parsePageStateFromUrl(new URL(`http://example.com${url}`))).toThrow(
                "The 'collection' analysis mode is not enabled.",
            );
        });

        it('parses and encodes collection filter with collectionId', () => {
            const url =
                '/wastewater/covid?' +
                'locationName=Z%C3%BCrich+%28ZH%29&' +
                'granularity=day&' +
                'analysisMode=collection&' +
                'collectionId=123&';
            const filter = handlerWithCollection.parsePageStateFromUrl(new URL(`http://example.com${url}`));

            expect(filter.analysis.mode).toBe('collection');
            const analysis = filter.analysis as WasapCollectionFilter;
            expect(analysis.collectionId).toBe(123);

            const newUrl = handlerWithCollection.toUrl(filter);
            expect(newUrl).toBe(url);
        });

        it('parses collection filter without collectionId', () => {
            const url = '/wastewater/covid?analysisMode=collection&';
            const filter = handlerWithCollection.parsePageStateFromUrl(new URL(`http://example.com${url}`));

            expect(filter.analysis.mode).toBe('collection');
            const analysis = filter.analysis as WasapCollectionFilter;
            expect(analysis.collectionId).toBeUndefined();
        });

        it('encodes collection filter omits undefined collectionId', () => {
            const url = '/wastewater/covid?analysisMode=collection&';
            const filter = handlerWithCollection.parsePageStateFromUrl(new URL(`http://example.com${url}`));

            const encodedUrl = handlerWithCollection.toUrl(filter);
            expect(encodedUrl).not.toContain('collectionId');
        });

        it('converts collectionId string to number', () => {
            const url = '/wastewater/covid?analysisMode=collection&collectionId=456&';
            const filter = handlerWithCollection.parsePageStateFromUrl(new URL(`http://example.com${url}`));

            const analysis = filter.analysis as WasapCollectionFilter;
            expect(typeof analysis.collectionId).toBe('number');
            expect(analysis.collectionId).toBe(456);
        });

        it('collection mode round-trip preserves collectionId', () => {
            const url = '/wastewater/covid?analysisMode=collection&collectionId=789&';
            const filter1 = handlerWithCollection.parsePageStateFromUrl(new URL(`http://example.com${url}`));
            const url2 = handlerWithCollection.toUrl(filter1);
            const filter2 = handlerWithCollection.parsePageStateFromUrl(new URL(`http://example.com${url2}`));

            const analysis1 = filter1.analysis as WasapCollectionFilter;
            const analysis2 = filter2.analysis as WasapCollectionFilter;
            expect(analysis2.collectionId).toBe(analysis1.collectionId);
        });
    });
});
