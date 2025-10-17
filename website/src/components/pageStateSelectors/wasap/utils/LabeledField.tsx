import type { ReactNode } from 'react';

import { useModalRef, Modal } from '../../../../styles/containers/Modal';

interface LabeledFieldProps {
    /**
     * The text label displayed above the field
     */
    label: string;
    /**
     * The form control element(s) to be displayed under the label
     */
    children: React.ReactNode;
    /**
     * Optional informational content displayed in a modal when the user clicks the "?" button.
     * If provided, a help button will be shown next to the label.
     */
    info?: ReactNode;
}

export function LabeledField({ label, children, info }: LabeledFieldProps) {
    const modalRef = useModalRef();

    return (
        <div className='form-control'>
            <div className={`flex flex-row items-baseline justify-between gap-2 ${info !== undefined ? 'mb-2' : ''}`}>
                <label className='label'>
                    <span className='label-text'>{label}</span>
                </label>
                {info !== undefined && (
                    <>
                        <button
                            type='button'
                            className='btn btn-xs'
                            onClick={() => modalRef.current?.showModal()}
                            aria-label={`Show information about ${label}`}
                        >
                            ?
                        </button>
                        <Modal modalRef={modalRef} size='large'>
                            {info}
                        </Modal>
                    </>
                )}
            </div>
            {children}
        </div>
    );
}
