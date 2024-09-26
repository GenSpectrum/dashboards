import type { PropsWithChildren } from 'react';

export function CardContent({ children }: PropsWithChildren) {
    return <div className='mb-2'>{children}</div>;
}
