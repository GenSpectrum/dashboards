import type { MutationAnnotation } from '@genspectrum/dashboard-components/util';

export const wastewaterPathFragment = 'swiss-wastewater';

export const wastewaterConfig = {
    menuListEntryDecoration: 'decoration-teal',
    backgroundColor: 'bg-tealMuted',
    backgroundColorFocus: 'group-hover:bg-teal',
    borderEntryDecoration: 'hover:border-teal',
    browseDataUrl: 'https://wise-loculus.genspectrum.org',
    browseDataDescription: 'Browse the data in the WISE Loculus instance.',
    lapisBaseUrl: 'https://api.wise-loculus.genspectrum.org',
    wasapLapisBaseUrl: 'https://lapis.wasap.genspectrum.org/',
    covSpectrumLapisBaseUrl: 'https://lapis.cov-spectrum.org/open/v2',
    pages: {
        rsv: {
            path: `/${wastewaterPathFragment}/rsv`,
            description: 'Analyze RSV data that was collected by the WISE project.',
        },
        influenza: {
            path: `/${wastewaterPathFragment}/flu`,
            description: 'Analyze Influenza data that was collected by the WISE project.',
        },
        covid: {
            path: `/${wastewaterPathFragment}/covid`,
            description: 'Analyze SARS-CoV-2 data that was collected by the WISE project.',
        },
    },
};

export const wastewaterBreadcrumb = {
    name: 'Swiss Wastewater',
    href: `/${wastewaterPathFragment}`,
};

export const RSVTypes = ['RSV-A', 'RSV-B'] as const;

export type RSVType = (typeof RSVTypes)[number];

export const InfluenzaTypes = ['H1', 'N1', 'H3', 'N2'] as const;

export type InfluenzaType = (typeof InfluenzaTypes)[number];

export function getMutationAnnotation(reference: InfluenzaType): MutationAnnotation[] {
    switch (reference) {
        case 'N1':
            return mutationAnnotationsN1;
        case 'N2':
            return mutationAnnotationsN2;
        default:
            return [];
    }
}

function symbolMap(medication: string): string {
    switch (medication) {
        case 'Laninamivir':
            return '*';
        case 'Oseltamivir':
            return '!';
        case 'Peramivir':
            return '^';
        case 'Zanamivir':
            return '+';
        default:
            return '';
    }
}

function createMutationAnnotation(medication: string, aaMutationList: string[]): MutationAnnotation {
    return {
        name: `${medication} resistance mutations`,
        description: `This mutation is associated with reduced inhibition by ${medication}, for more details see the <a class='link' href='https://www.who.int/teams/global-influenza-programme/laboratory-network/quality-assurance/antiviral-susceptibility-influenza/neuraminidase-inhibitor'>Global Influenza Programme Report</a>.`,
        symbol: symbolMap(medication),
        nucleotideMutations: [],
        aminoAcidMutations: aaMutationList,
    };
}

// See https://github.com/anna-parker/NAIMutations/tree/main for calculation details
// TODO(#650): Some mutations are only of interest when with other mutations (e.g. deletions) but are now marked individually
const mutationAnnotationsN1: MutationAnnotation[] = [
    createMutationAnnotation('Laninamivir', [
        'P458T',
        'S247R',
        'H275Y',
        'E119A',
        'Q136K',
        'E119D',
        'E119G',
        'Q136R',
        'I223R',
        'I427T',
        'I223K',
        'I436N',
        'R152K',
    ]),
    createMutationAnnotation('Oseltamivir', [
        'E119D',
        'I223R',
        'I427T',
        'E119V',
        'S247N',
        'P458T',
        'I223M',
        'S247G',
        'R293K',
        'I223L',
        'S247R',
        'Q313R',
        'N295S',
        'I223K',
        'R152K',
        'D199E',
        'H275Y',
        'D199N',
        'E119A',
        'D199Y',
        'G147R',
        'E119G',
        'I223V',
        'I436N',
        'D199G',
    ]),
    createMutationAnnotation('Peramivir', [
        'P458T',
        'S247R',
        'H275Y',
        'Q136K',
        'D199N',
        'G147R',
        'E119D',
        'E119G',
        'Q136R',
        'I223R',
        'I223K',
        'E119V',
        'I436N',
        'I223V',
        'S247N',
    ]),
    createMutationAnnotation('Zanamivir', [
        'P458T',
        'S247R',
        'H275Y',
        'E119A',
        'Q136K',
        'D199Y',
        'E119D',
        'E119G',
        'S110F',
        'Q136R',
        'I427T',
        'E119V',
        'I436N',
        'I223K',
        'I223R',
        'I117R',
    ]),
];

// WHO uses reference KJ609208.1 and AB124658.1, mutations here use reference CY114383.1
// When KJ609208.1 and AB124658.1 are aligned to CY114383.1 using nextclade we see no insertions/deletions only mutations
// Therefore, we can use CY114383.1 as the reference for the mutations
// See https://github.com/anna-parker/NAIMutations/tree/main for calculation details
// TODO(#650): Some mutations are only of interest when with other mutations (e.g. deletions) but are now marked individually
const mutationAnnotationsN2: MutationAnnotation[] = [
    createMutationAnnotation('Laninamivir', ['T148I', 'E119V', 'N142S']),
    createMutationAnnotation('Oseltamivir', [
        'E276D',
        'N329R',
        'N245Y',
        'E119V',
        'K249E',
        'R371K',
        'R292K',
        'S331R',
        'T148I',
        'E119I',
        'I222V',
        'N294S',
        'D151E',
        'I222L',
        'I222T',
        'R224K',
        '247-',
        'Q391K',
        'N142S',
        '248-',
        '245-',
        '250-',
    ]),
    createMutationAnnotation('Peramivir', ['N142S', 'E119V', 'R292K', 'D151A', 'T148I']),
    createMutationAnnotation('Zanamivir', [
        'E276D',
        'R224K',
        'E119I',
        'Q136K',
        '247-',
        'Q391K',
        'E119D',
        'R371K',
        'N142S',
        'K249E',
        'E119V',
        'R292K',
        '250-',
        'D151G',
        'D151A',
        'T148I',
    ]),
];
