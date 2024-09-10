import { type ReactNode } from 'react';

export function ModalBox({ children }: { children: ReactNode }) {
    return <div className={'modal-box p-0'}>{children}</div>;
}
