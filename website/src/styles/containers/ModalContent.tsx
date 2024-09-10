import type { ReactNode } from 'react';

export function ModalContent({ children }: { children: ReactNode }) {
    return <div className='p-6'>{children}</div>;
}
