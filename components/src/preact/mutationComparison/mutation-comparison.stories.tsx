import { LAPIS_URL, NUCLEOTIDE_INSERTIONS_ENDPOINT, NUCLEOTIDE_MUTATIONS_ENDPOINT } from '../../constants';
import { Meta, StoryObj } from '@storybook/preact';
import { MutationComparison, MutationComparisonProps } from './mutation-comparison';
import { LapisUrlContext } from '../LapisUrlContext';
import nucleotideMutationsSomeVariant from './__mockData__/nucleotideMutationsSomeVariant.json';
import nucleotideInsertionsSomeVariant from './__mockData__/nucleotideInsertionsSomeVariant.json';
import nucleotideMutationsOtherVariant from './__mockData__/nucleotideMutationsOtherVariant.json';
import nucleotideInsertionsOtherVariant from './__mockData__/nucleotideInsertionsOtherVariant.json';

const meta: Meta<MutationComparisonProps> = {
    title: 'Visualization/Mutation comparison',
    component: MutationComparison,
    argTypes: {
        variants: [{ control: 'object' }],
        sequenceType: {
            options: ['nucleotide', 'amino acid'],
            control: { type: 'radio' },
        },
        views: {
            options: ['table', 'venn'],
            control: { type: 'check' },
        },
    },
    parameters: {
        fetchMock: {},
    },
};

export default meta;

const Template: StoryObj<MutationComparisonProps> = {
    render: (args) => (
        <LapisUrlContext.Provider value={LAPIS_URL}>
            <MutationComparison variants={args.variants} sequenceType={args.sequenceType} views={args.views} />
        </LapisUrlContext.Provider>
    ),
};

const dateToSomeVariant = '2022-01-01';

const dateToOtherVariant = '2022-01-02';
const dateFromOtherVariant = '2021-01-01';

export const TwoVariants = {
    ...Template,
    args: {
        variants: [
            {
                displayName: 'Some variant',
                lapisFilter: { country: 'Switzerland', pangoLineage: 'B.1.1.7', dateTo: dateToSomeVariant },
            },
            {
                displayName: 'Other variant',
                lapisFilter: {
                    country: 'Switzerland',
                    pangoLineage: 'B.1.1.7',
                    dateFrom: dateFromOtherVariant,
                    dateTo: dateToOtherVariant,
                },
            },
        ],
        sequenceType: 'nucleotide',
        views: ['table', 'venn'],
    },
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: {
                        name: 'nucleotideMutationsSomeVariant',
                        url: NUCLEOTIDE_MUTATIONS_ENDPOINT,
                        query: {
                            country: 'Switzerland',
                            pangoLineage: 'B.1.1.7',
                            dateTo: dateToSomeVariant,
                            minProportion: 0,
                        },
                    },
                    response: {
                        status: 200,
                        body: nucleotideMutationsSomeVariant,
                    },
                },
                {
                    matcher: {
                        name: 'nucleotideInsertionsSomeVariant',
                        url: NUCLEOTIDE_INSERTIONS_ENDPOINT,
                        query: { country: 'Switzerland', pangoLineage: 'B.1.1.7', dateTo: dateToSomeVariant },
                    },
                    response: {
                        status: 200,
                        body: nucleotideInsertionsSomeVariant,
                    },
                },
                {
                    matcher: {
                        name: 'nucleotideMutationsOtherVariant',
                        url: NUCLEOTIDE_MUTATIONS_ENDPOINT,
                        query: {
                            country: 'Switzerland',
                            pangoLineage: 'B.1.1.7',
                            dateFrom: dateFromOtherVariant,
                            dateTo: dateToOtherVariant,
                            minProportion: 0,
                        },
                    },
                    response: {
                        status: 200,
                        body: nucleotideMutationsOtherVariant,
                    },
                },
                {
                    matcher: {
                        name: 'nucleotideInsertionsOtherVariant',
                        url: NUCLEOTIDE_INSERTIONS_ENDPOINT,
                        query: {
                            country: 'Switzerland',
                            pangoLineage: 'B.1.1.7',
                            dateFrom: dateFromOtherVariant,
                            dateTo: dateToOtherVariant,
                        },
                    },
                    response: {
                        status: 200,
                        body: nucleotideInsertionsOtherVariant,
                    },
                },
            ],
        },
    },
};
