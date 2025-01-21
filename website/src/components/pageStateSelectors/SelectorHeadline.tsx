import type { PropsWithChildren } from 'react';

export function SelectorHeadline({ children }: PropsWithChildren) {
    return <h1 className='mb-2 font-bold capitalize'>{children}</h1>;
}
