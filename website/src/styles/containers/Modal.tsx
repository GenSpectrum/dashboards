import { type FC, type PropsWithChildren, type RefObject, useRef } from 'react';

import { ModalBox } from './ModalBox.tsx';

export function useModalRef() {
    return useRef<HTMLDialogElement>(null);
}

const modalSize = {
    large: 'max-w-(--breakpoint-lg)',
};

type ModalProps = (
    | {
          /** set this when using from React and open it via `modalRef.current?.showModal()` */
          modalRef: RefObject<HTMLDialogElement>;
          id?: undefined;
      }
    | {
          /** set this when using from Astro and open it via `onclick="id.showModal()"` */
          id: string;
          modalRef?: undefined;
      }
) & {
    size?: keyof typeof modalSize;
};

export const Modal: FC<PropsWithChildren<ModalProps>> = ({ children, modalRef, id, size }) => {
    return (
        <dialog className='modal' ref={modalRef} id={id}>
            <ModalBox className={size !== undefined ? modalSize[size] : ''}>{children}</ModalBox>
            <form method='dialog' className='modal-backdrop'>
                <button>close on clicking outside of modal</button>
            </form>
        </dialog>
    );
};
