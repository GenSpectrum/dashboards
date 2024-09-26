import { type PropsWithChildren } from 'react';

export function ModalBox({ children }: PropsWithChildren) {
    return <div className={'modal-box p-0'}>{children}</div>;
}
