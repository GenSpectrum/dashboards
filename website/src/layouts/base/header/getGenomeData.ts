import { type Organism, organismConfig } from '../../../types/Organism.ts';

export type GenomeData = {
    url: string;
    genomeLength: number;
};

type GenomeDataSections = {
    [key in Organism | 'swissWastewater']: GenomeData[];
};

export function getGenomeDataSections(): GenomeDataSections {
    const sections = Object.values(organismConfig).reduce((acc, config) => {
        const genomeMap: GenomeData[] = config.genome.map((genome) => {
            return {
                url: genome.gff3Source,
                genomeLength: genome.genomeLength,
            };
        });
        acc[config.organism] = genomeMap;
        return acc;
    }, {} as GenomeDataSections);

    return sections;
}
