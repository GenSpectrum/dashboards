import type { PropsWithChildren } from 'react';

export function ModalContent({ children }: PropsWithChildren) {
    return <div className='p-6'>{children}</div>;
}
