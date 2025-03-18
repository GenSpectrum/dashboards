export const wastewaterPathFragment = 'swiss-wastewater';

export const wastewaterConfig = {
    menuListEntryDecoration: 'decoration-teal',
    backgroundColor: 'bg-tealMuted',
    backgroundColorFocus: 'group-hover:bg-teal',
    borderEntryDecoration: 'hover:border-teal',
    browseDataUrl: 'https://wise-loculus.genspectrum.org',
    lapisBaseUrl: 'https://api.wise-loculus.genspectrum.org',
    pages: {
        rsv: `/${wastewaterPathFragment}/rsv`,
        influenza: `/${wastewaterPathFragment}/flu`,
    },
};

export const RSVTypes = ['RSV-A', 'RSV-B'] as const;

export type RSVType = (typeof RSVTypes)[number];
