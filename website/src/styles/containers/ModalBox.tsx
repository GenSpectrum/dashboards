import { type PropsWithChildren } from 'react';

export function ModalBox({ children, className }: PropsWithChildren<{ className?: string }>) {
    return <div className={`modal-box p-0 ${className ?? ''}`}>{children}</div>;
}
