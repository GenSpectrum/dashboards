import { type Organism, organismConfig } from '../../../types/Organism.ts';

export type GenomeData = {
    gff3Source: string;
    genomeLength: number;
    name?: string;
};

type GenomeDataSections = {
    [key in Organism | 'swissWastewater']: GenomeData[];
};

export function getGenomeDataSections(): GenomeDataSections {
    const sections = Object.values(organismConfig).reduce((acc, config) => {
        if (!('genome' in config)) {
            acc[config.organism] = [];
            return acc;
        }
        const genomeMap: GenomeData[] = config.genome.map((genome) => {
            return {
                gff3Source: genome.gff3Source,
                genomeLength: genome.genomeLength,
                name: 'name' in genome ? genome.name : undefined,
            };
        });
        acc[config.organism] = genomeMap;
        return acc;
    }, {} as GenomeDataSections);

    return sections;
}
