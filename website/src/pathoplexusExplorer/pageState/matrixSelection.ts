import { NOTHING, type Dimension } from '../dataLayer/queries/dimensions.ts';
import { acceptedValues, type Constraint, type Constraints } from '../dataLayer/queries/selection.ts';
import { decodedValue } from '../domain/text.ts';

const NOTHING_TOKEN = '(none)';

export function parseConstraints(text: string | null): Constraints {
    // Use a prototype-free object for keys read from the URL.
    const dimensions = Object.create(null) as Record<string, Constraint>;
    for (const part of (text ?? '').split(';')) {
        const equals = part.indexOf('=');
        if (equals <= 0) {
            continue;
        }
        const id = decodedValue(part.slice(0, equals));
        const body = part.slice(equals + 1);
        const exclude = body.startsWith('!');
        const values = (exclude ? body.slice(1) : body)
            .split(',')
            .filter((value) => value !== '')
            .map((value) => (value === NOTHING_TOKEN ? NOTHING : decodedValue(value)));
        if (values.length > 0) {
            dimensions[id] = exclude ? { values, exclude } : { values };
        }
    }
    return dimensions;
}

export function formatConstraints(dimensions: Constraints): string {
    return Object.entries(dimensions)
        .filter((entry): entry is [string, Constraint] => (entry[1]?.values.length ?? 0) > 0)
        .map(([id, constraint]) => {
            const values = constraint.values
                .map((value) => (value === NOTHING ? NOTHING_TOKEN : encodeURIComponent(value)))
                .join(',');
            return `${encodeURIComponent(id)}=${constraint.exclude === true ? '!' : ''}${values}`;
        })
        .join(';');
}

export function withValueToggled(dimensions: Constraints, id: string, value: string): Constraints {
    const current = dimensions[id] ?? { values: [] };
    const values = current.values.includes(value)
        ? current.values.filter((candidate) => candidate !== value)
        : [...current.values, value];
    return values.length === 0 ? withDimensionCleared(dimensions, id) : { ...dimensions, [id]: { ...current, values } };
}

export function withDimensionCleared(dimensions: Constraints, id: string): Constraints {
    const { [id]: _dropped, ...rest } = dimensions;
    return rest;
}

export function withDimensionInverted(dimensions: Constraints, id: string): Constraints {
    const current = dimensions[id];
    if (current === undefined) {
        return dimensions;
    }
    return { ...dimensions, [id]: { ...current, exclude: current.exclude !== true } };
}

export function constrainedCount(dimensions: Constraints): number {
    return Object.values(dimensions).filter((constraint) => (constraint?.values.length ?? 0) > 0).length;
}

/** Remove constraints on dimensions that are not offered, and values that their dimension cannot filter by. */
export function withoutStrandedChoices(
    dimensions: Constraints,
    offered: readonly Dimension[],
): Constraints | undefined {
    const byId = new Map(offered.map((dimension) => [dimension.id, dimension] as const));
    let changed = false;
    const kept: Record<string, Constraint> = {};
    for (const [id, constraint] of Object.entries(dimensions)) {
        if (constraint === undefined || constraint.values.length === 0) {
            continue;
        }
        const dimension = byId.get(id);
        const values = dimension === undefined ? [] : acceptedValues(dimension, constraint.values);
        if (values.length !== constraint.values.length) {
            changed = true;
        }
        if (values.length > 0) {
            kept[id] = { ...constraint, values };
        }
    }
    return changed ? kept : undefined;
}
