export const dataOrigins = {
    insdc: 'insdc' as const,
    pathoplexus: 'pathoplexus' as const,
    nextstrain: 'nextstrain' as const,
    wise: 'wise' as const,
};

export const dataOriginConfig = {
    [dataOrigins.insdc]: { name: 'INSDC', href: 'https://www.insdc.org/' },
    [dataOrigins.pathoplexus]: { name: 'Pathoplexus', href: 'https://pathoplexus.org/' },
    [dataOrigins.nextstrain]: { name: 'INSDC (curated by Nextstrain)', href: 'https://nextstrain.org/' },
    [dataOrigins.wise]: { name: 'WISE', href: 'https://wise.ethz.ch' },
};

export type DataOrigin = keyof typeof dataOriginConfig;
