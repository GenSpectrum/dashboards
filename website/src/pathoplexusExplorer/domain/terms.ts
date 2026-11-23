import { parseVariant } from './variant.ts';

const JOIN = ' & ';

/** Split a conjunction into its operands, each one a term. Keep any other expression together as one term. */
export function termsOf(query: string): string[] {
    const trimmed = query.trim();
    if (trimmed === '') {
        return [];
    }
    const parsed = parseVariant(trimmed);
    if (!parsed.ok || parsed.node.type !== 'and') {
        return [trimmed];
    }
    const parts = topLevelParts(trimmed, '&');
    return parts.length > 1 && parts.every((part) => parseVariant(part).ok) ? parts : [trimmed];
}

/** Split at each separator outside parentheses and brackets. */
function topLevelParts(query: string, separator: '&' | '|'): string[] {
    const parts: string[] = [];
    let depth = 0;
    let start = 0;
    for (let index = 0; index < query.length; index++) {
        const char = query[index];
        if (char === '(' || char === '[') {
            depth++;
        } else if (char === ')' || char === ']') {
            depth--;
        } else if (char === separator && depth === 0) {
            parts.push(query.slice(start, index).trim());
            start = index + 1;
        }
    }
    parts.push(query.slice(start).trim());
    return parts;
}

/** A disjunction binds more loosely than `&`, so one outside parentheses is grouped before it is joined. */
function grouped(term: string): string {
    return topLevelParts(term, '|').length > 1 ? `(${term})` : term;
}

function queryOf(terms: readonly string[]): string {
    const kept = terms.map((term) => term.trim()).filter((term) => term !== '');
    return kept.length === 1 ? kept[0] : kept.map(grouped).join(JOIN);
}

export function isReadable(term: string): boolean {
    return parseVariant(term).ok;
}

export function withTerm(query: string, term: string): string {
    const terms = termsOf(query);
    return terms.includes(term) ? query : queryOf([...terms, term]);
}

export function withoutTerm(query: string, index: number): string {
    return queryOf(termsOf(query).filter((_, position) => position !== index));
}
