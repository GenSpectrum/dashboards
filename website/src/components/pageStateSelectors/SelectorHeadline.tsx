import { type ReactNode, type PropsWithChildren } from 'react';

import { useModalRef, Modal } from '../../styles/containers/Modal';

type SelectorHeadlineProps = PropsWithChildren<{
    info?: ReactNode;
}>;

export function SelectorHeadline({ children, info }: SelectorHeadlineProps) {
    const modalRef = useModalRef();

    if (info === undefined) {
        return <h1 className='mb-2 font-bold capitalize'>{children}</h1>;
    }

    return (
        <div className='flex flex-row items-baseline justify-between gap-2'>
            <h1 className='mb-2 font-bold capitalize'>{children}</h1>
            <button type='button' className='btn btn-xs' onClick={() => modalRef.current?.showModal()}>
                ?
            </button>
            <Modal modalRef={modalRef} size='large'>
                {info}
            </Modal>
        </div>
    );
}
