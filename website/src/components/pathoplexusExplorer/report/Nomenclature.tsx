import { Fragment, type ReactNode } from 'react';

import { OutboundLink } from './Layout.tsx';
import { nomenclatureOf } from '../../../pathoplexusExplorer/domain/nomenclature.ts';
import type { Subject } from '../../../pathoplexusExplorer/domain/subject.ts';

export function nomenclatureNote(what: Subject): ReactNode | undefined {
    const parts = nomenclatureOf(what);
    if (parts === undefined) {
        return undefined;
    }
    return (
        <>
            {parts.map((part) =>
                typeof part === 'string' ? (
                    <Fragment key={part}>{part}</Fragment>
                ) : (
                    <OutboundLink key={part.href} href={part.href}>
                        {part.label}
                    </OutboundLink>
                ),
            )}
        </>
    );
}
