import type { Place } from './geography.ts';
import { isPathogenNode, type PathogenNode, type Subject } from './subject.ts';

export type Period = { from?: string; to?: string };

export type Scope = {
    what: Subject;
    where: Place;
    period: Period;
    variant?: string;
    /** Exclude a nested subject and its descendants from a comparison scope. */
    except?: Subject;
};

export function hasVariant(scope: Scope): scope is Scope & { variant: string; what: PathogenNode } {
    return (scope.variant ?? '').trim() !== '' && isPathogenNode(scope.what);
}
