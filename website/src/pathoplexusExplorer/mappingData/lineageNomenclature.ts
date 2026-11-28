/** Sources for the lineage names shown in reports. */

export type NomenclaturePart = string | { label: string; href: string };

/* eslint-disable @typescript-eslint/naming-convention -- the keys are the instance's table names */
export const LINEAGE_NOMENCLATURE: Readonly<Record<string, readonly NomenclaturePart[]>> = {
    rsv_a: [
        'The lineages were assigned using the ',
        {
            label: 'RSV Genotyping Consensus Consortium',
            href: 'https://github.com/rsv-lineages/lineage-designation-A',
        },
        ' nomenclature.',
    ],
    rsv_b: [
        'The lineages were assigned using the ',
        {
            label: 'RSV Genotyping Consensus Consortium',
            href: 'https://github.com/rsv-lineages/lineage-designation-B',
        },
        ' nomenclature.',
    ],
    hmpv: [
        'The lineages were assigned using the nomenclature of ',
        { label: 'Groen et al. (2023)', href: 'https://doi.org/10.1128/mbio.02280-22' },
        '.',
    ],
    dengue: [
        'The lineages were assigned using the ',
        { label: 'Dengue Lineages', href: 'https://dengue-lineages.org/' },
        ' system.',
    ],
    measles: [
        'The genotypes were assigned using the ',
        { label: 'WHO measles genotype nomenclature', href: 'https://www.who.int/publications/i/item/WER8709' },
        '.',
    ],
    west_nile: [
        'The lineages were assigned using the definitions of the ',
        {
            label: 'Genome Detective West Nile virus typing tool',
            href: 'https://www.genomedetective.com/app/typingtool/wnv/introduction',
        },
        '.',
    ],
    zika: [
        'The clades were assigned using the ',
        {
            label: 'Zika virus genotype dataset',
            href: 'https://github.com/InstitutoTodosPelaSaude/nextclade-datasets-workflows/tree/main/zikav',
        },
        ' of the Instituto Todos pela Saúde.',
    ],
    chikungunya: [
        'The clades were assigned using the ',
        {
            label: 'chikungunya genotype dataset',
            href: 'https://github.com/V-GEN-Lab/nextclade-datasets-workflow/tree/main/chikV',
        },
        ' of V-GEN-Lab.',
    ],
    yellow_fever: [
        'The clades were assigned using the ',
        { label: 'Nextstrain yellow fever clades', href: 'https://github.com/nextstrain/yellow-fever' },
        ', which correspond to the established genotypes.',
    ],
    cchf: [
        'The S-segment lineages were assigned using the clades of ',
        { label: 'Carroll et al. (2010)', href: 'https://doi.org/10.1016/j.ympev.2010.01.006' },
        '.',
    ],
    marburg: [
        'The clades were assigned using the nomenclature of ',
        { label: 'Zehender et al. (2016)', href: 'https://doi.org/10.1016/j.meegid.2016.06.014' },
        '.',
    ],
    mpox: [
        'The clades were assigned using the ',
        { label: 'WHO mpox clade nomenclature', href: 'https://doi.org/10.1371/journal.pbio.3001769' },
        ', outbreaks and lineages were assigned using the ',
        { label: 'mpox outbreak lineage nomenclature', href: 'https://github.com/mpxv-lineages/lineage-designation' },
        '.',
    ],
};
