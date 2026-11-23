import { GENETIC_CODE_BASES, GENETIC_CODE_RESIDUES, NUCLEOTIDE_COMPLEMENTS } from '../mappingData/geneticCode.ts';

const GENETIC_CODE: ReadonlyMap<string, string> = (() => {
    const code = new Map<string, string>();
    let index = 0;
    for (const first of GENETIC_CODE_BASES) {
        for (const second of GENETIC_CODE_BASES) {
            for (const third of GENETIC_CODE_BASES) {
                code.set(`${first}${second}${third}`, GENETIC_CODE_RESIDUES[index++]);
            }
        }
    }
    return code;
})();

export function residueOf(codon: string): string {
    return GENETIC_CODE.get(codon.toUpperCase()) ?? 'X';
}

export function translate(sequence: string, frame: number): string {
    let protein = '';
    for (let position = frame; position + 2 < sequence.length; position += 3) {
        protein += residueOf(sequence.slice(position, position + 3));
    }
    return protein;
}

export function reverseComplement(sequence: string): string {
    let result = '';
    for (let index = sequence.length - 1; index >= 0; index--) {
        result += NUCLEOTIDE_COMPLEMENTS[sequence[index].toUpperCase()] ?? 'N';
    }
    return result;
}
