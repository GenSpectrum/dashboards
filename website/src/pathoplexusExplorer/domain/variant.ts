/** Parse the variant notation used by the report's mutation filter: terms combined with `&`, `|`, `!` and parentheses. */

import { UNEXPECTED_ERROR } from './text.ts';

export const MUTATION_KIND = {
    nucleotide: 'nucleotide',
    aminoAcid: 'aminoAcid',
} as const;
export type MutationKind = (typeof MUTATION_KIND)[keyof typeof MUTATION_KIND];

export type MutationTerm = {
    type: 'mutation';
    prefix?: string;
    from?: string;
    position: number;
    to?: string;
    raw: string;
};

export type InsertionTerm = { type: 'insertion'; prefix?: string; position: number; value: string };

export type LineageTerm = { type: 'lineage'; column: string; value: string; sublineages: boolean };

export type VariantNode =
    | MutationTerm
    | InsertionTerm
    | LineageTerm
    | { type: 'and'; children: VariantNode[] }
    | { type: 'or'; children: VariantNode[] }
    | { type: 'not'; child: VariantNode };

export type ParseResult = { ok: true; node: VariantNode } | { ok: false };

const NUCLEOTIDE = /^([A-Z.*-]?)(\d+)([A-Z.*-]?)$/;

class ParseError extends Error {}

type Token = { kind: '&' | '|' | '!' | '(' | ')' } | { kind: 'word'; text: string };

const PUNCTUATION = new Set(['&', '|', '!', '(', ')']);
const WORD_END = /[\s&|!()[\],]/;

function tokenize(text: string): Token[] {
    const tokens: Token[] = [];
    let index = 0;
    while (index < text.length) {
        const char = text[index];
        if (/\s/.test(char)) {
            index++;
            continue;
        }
        if (PUNCTUATION.has(char)) {
            tokens.push({ kind: char as '&' });
            index++;
            continue;
        }
        let end = index;
        while (end < text.length && !WORD_END.test(text[end])) {
            end++;
        }
        if (end === index) {
            throw new ParseError();
        }
        tokens.push({ kind: 'word', text: text.slice(index, end) });
        index = end;
    }
    return tokens;
}

export function parseVariant(text: string): ParseResult {
    try {
        const tokens = tokenize(text);
        if (tokens.length === 0) {
            return { ok: false };
        }
        const parser = new Parser(tokens);
        const node = parser.expression();
        parser.expectEnd();
        return { ok: true, node };
    } catch (error) {
        if (error instanceof ParseError) {
            return { ok: false };
        }
        throw error;
    }
}

class Parser {
    private index = 0;

    constructor(private readonly tokens: Token[]) {}

    expression(): VariantNode {
        const children = [this.conjunction()];
        while (this.peek()?.kind === '|') {
            this.index++;
            children.push(this.conjunction());
        }
        return children.length === 1 ? children[0] : { type: 'or', children };
    }

    expectEnd() {
        if (this.peek() !== undefined) {
            throw new ParseError();
        }
    }

    private conjunction(): VariantNode {
        const children = [this.unary()];
        while (this.peek()?.kind === '&') {
            this.index++;
            children.push(this.unary());
        }
        return children.length === 1 ? children[0] : { type: 'and', children };
    }

    private unary(): VariantNode {
        const token = this.next();
        switch (token.kind) {
            case '!':
                return { type: 'not', child: this.unary() };
            case '(': {
                const inner = this.expression();
                this.expect(')');
                return inner;
            }
            case 'word':
                return termOf(token.text);
            default:
                throw new ParseError();
        }
    }

    private peek(): Token | undefined {
        return this.tokens[this.index];
    }

    private next(): Token {
        if (this.index >= this.tokens.length) {
            throw new ParseError();
        }
        return this.tokens[this.index++];
    }

    private expect(kind: ')') {
        if (this.next().kind !== kind) {
            throw new ParseError();
        }
    }
}

function termOf(word: string): VariantNode {
    if (/^ins_/i.test(word)) {
        const parts = word.slice(4).split(':');
        const complete = parts.length === 3 ? parts : parts.length === 2 ? ['', parts[0], parts[1]] : ['', '', ''];
        const [prefix, position, value] = complete;
        if (!/^\d+$/.test(position) || value === '') {
            throw new ParseError();
        }
        return {
            type: 'insertion',
            prefix: prefix === '' ? undefined : prefix,
            position: Number(position),
            value: value.toUpperCase(),
        };
    }
    const colon = word.indexOf(':');
    if (colon < 0) {
        const match = NUCLEOTIDE.exec(word.toUpperCase());
        if (match === null) {
            throw new ParseError();
        }
        return mutationOf(undefined, match, word);
    }
    const prefix = word.slice(0, colon);
    const rest = word.slice(colon + 1);
    if (prefix === '' || rest === '') {
        throw new ParseError();
    }
    const match = NUCLEOTIDE.exec(rest.toUpperCase());
    if (match !== null) {
        return mutationOf(prefix, match, rest);
    }
    const sublineages = rest.endsWith('*');
    return { type: 'lineage', column: prefix, value: sublineages ? rest.slice(0, -1) : rest, sublineages };
}

function mutationOf(prefix: string | undefined, match: RegExpExecArray, raw: string): MutationTerm {
    const position = Number(match[2]);
    if (position < 1) {
        throw new ParseError();
    }
    return {
        type: 'mutation',
        prefix,
        from: match[1] === '' ? undefined : match[1],
        position,
        to: match[3] === '' ? undefined : match[3],
        raw,
    };
}

export type ReferenceSequence = { name: string; display: string };

export type ReferenceSequences = {
    nucleotide: readonly ReferenceSequence[];
    aminoAcid: readonly ReferenceSequence[];
};

export type VariantContext = {
    sequences: ReferenceSequences;
    columns: readonly { column: string; hierarchical: boolean }[];
};

/** Resolve the sequence and position. Read the reference symbol from the genome. */
export type ResolvedMutation = {
    type: 'mutation';
    kind: MutationKind;
    sequence: string;
    display: string;
    position: number;
    to?: string;
};

export type ResolvedInsertion = {
    type: 'insertion';
    kind: MutationKind;
    sequence: string;
    display: string;
    position: number;
    value: string;
};

export type ResolvedNode =
    | ResolvedMutation
    | ResolvedInsertion
    | LineageTerm
    | { type: 'and'; children: ResolvedNode[] }
    | { type: 'or'; children: ResolvedNode[] }
    | { type: 'not'; child: ResolvedNode };

export type ResolveResult = { ok: true; node: ResolvedNode } | { ok: false; error: string };

class ResolveError extends Error {}

export function resolveVariant(node: VariantNode, context: VariantContext): ResolveResult {
    try {
        return { ok: true, node: resolveNode(node, context) };
    } catch (error) {
        if (error instanceof ResolveError) {
            return { ok: false, error: error.message };
        }
        throw error;
    }
}

function resolveNode(node: VariantNode, context: VariantContext): ResolvedNode {
    switch (node.type) {
        case 'and':
        case 'or':
            return { type: node.type, children: node.children.map((child) => resolveNode(child, context)) };
        case 'not':
            return { type: node.type, child: resolveNode(node.child, context) };
        case 'lineage':
            return resolveLineage(node, context);
        case 'mutation': {
            const column = node.prefix === undefined ? undefined : findColumn(node.prefix, context);
            if (column !== undefined) {
                return resolveLineage({ type: 'lineage', column, value: node.raw, sublineages: false }, context);
            }
            const sequence = findSequence(node.prefix, context);
            return { type: 'mutation', ...sequence, position: node.position, to: node.to };
        }
        case 'insertion': {
            const sequence = findSequence(node.prefix, context);
            return { type: 'insertion', ...sequence, position: node.position, value: node.value };
        }
    }
}

function findColumn(name: string, context: VariantContext): string | undefined {
    return context.columns.find((column) => column.column.toLowerCase() === name.toLowerCase())?.column;
}

function resolveLineage(node: LineageTerm, context: VariantContext): LineageTerm {
    const column = context.columns.find((candidate) => candidate.column.toLowerCase() === node.column.toLowerCase());
    if (column === undefined) {
        throw new ResolveError(
            `"${node.column}" is neither a gene nor a subtype column. Genes: ${listOf(context.sequences.aminoAcid)}.`,
        );
    }
    return { ...node, column: column.column, sublineages: node.sublineages && column.hierarchical };
}

function findSequence(
    prefix: string | undefined,
    context: VariantContext,
): { kind: MutationKind; sequence: string; display: string } {
    const { nucleotide, aminoAcid } = context.sequences;
    if (nucleotide.length === 0 && aminoAcid.length === 0) {
        throw new ResolveError(`There is no reference genome for this selection. ${UNEXPECTED_ERROR}`);
    }
    if (prefix === undefined) {
        if (nucleotide.length === 1) {
            return { kind: MUTATION_KIND.nucleotide, sequence: nucleotide[0].name, display: nucleotide[0].display };
        }
        throw new ResolveError(
            `Specify a segment for the nucleotide mutation. Available segments are: ${listOf(nucleotide)}.`,
        );
    }
    const lower = prefix.toLowerCase();
    const gene = aminoAcid.find((sequence) => sequence.display.toLowerCase() === lower);
    if (gene !== undefined) {
        return { kind: MUTATION_KIND.aminoAcid, sequence: gene.name, display: gene.display };
    }
    const segment = nucleotide.find((sequence) => sequence.display !== '' && sequence.display.toLowerCase() === lower);
    if (segment !== undefined) {
        return { kind: MUTATION_KIND.nucleotide, sequence: segment.name, display: segment.display };
    }
    throw new ResolveError(
        aminoAcid.length === 0
            ? 'The reference genome has no genes in the dataset.'
            : `“${prefix}” is not a valid gene. Available genes: ${listOf(aminoAcid)}.`,
    );
}

function listOf(sequences: readonly ReferenceSequence[]): string {
    const names = sequences.map((sequence) => sequence.display).filter((name) => name !== '');
    return names.length > 12 ? `${names.slice(0, 12).join(', ')}, …` : names.join(', ');
}

export function mutationLabel(mutation: { display: string; from?: string; position: number; to?: string }): string {
    return `${mutation.display === '' ? '' : `${mutation.display}:`}${mutation.from ?? ''}${mutation.position}${mutation.to ?? ''}`;
}

/** Returns a single mutation only when it is the entire query. */
export function singleMutationOf(node: ResolvedNode): ResolvedMutation | undefined {
    if (node.type === 'mutation') {
        return node;
    }
    if ((node.type === 'and' || node.type === 'or') && node.children.length === 1) {
        return singleMutationOf(node.children[0]);
    }
    return undefined;
}

export function insertionsOf(node: ResolvedNode): ResolvedInsertion[] {
    switch (node.type) {
        case 'and':
        case 'or':
            return node.children.flatMap(insertionsOf);
        case 'not':
            return insertionsOf(node.child);
        case 'insertion':
            return [node];
        default:
            return [];
    }
}

export function mutationsOf(node: ResolvedNode): ResolvedMutation[] {
    switch (node.type) {
        case 'and':
        case 'or':
            return node.children.flatMap(mutationsOf);
        case 'not':
            return mutationsOf(node.child);
        case 'mutation':
            return [node];
        default:
            return [];
    }
}
