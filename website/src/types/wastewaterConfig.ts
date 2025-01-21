const pathFragment = 'swiss-wastewater';

export const wastewaterConfig = {
    menuListEntryDecoration: 'decoration-amber-600',
    browseDataUrl: 'https://wise-loculus.genspectrum.org',
    lapisBaseUrl: 'https://api.wise-loculus.genspectrum.org',
    pages: {
        rsv: `/${pathFragment}/rsv`,
        influenza: `/${pathFragment}/influenza`,
    },
};
