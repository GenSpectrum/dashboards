import type { LapisFilter } from '@genspectrum/dashboard-components/util';
import type { FC } from 'react';

import { assembleDownloadUrl } from './assembleDownloadUrl';
import { Modal, useModalRef } from '../../styles/containers/Modal';
import { ModalContent } from '../../styles/containers/ModalContent';
import { ModalHeader } from '../../styles/containers/ModalHeader';

export type DownloadLink = {
    label: string;
    filter: LapisFilter;
    downloadFileBasename: string;
};

export type AccessionsDownloadButtonProps = {
    accessionDownloadFields: string[];
    downloadLinks: DownloadLink[];
    lapisUrl: string;
};

export const AccessionsDownloadButton: FC<AccessionsDownloadButtonProps> = ({
    accessionDownloadFields,
    downloadLinks,
    lapisUrl,
}) => {
    const modalRef = useModalRef();

    return (
        <>
            <button className='btn btn-ghost btn-xs' onClick={() => modalRef.current?.showModal()}>
                <span className='iconify mdi--download text-base'></span>
                <span className='font-normal'>Download data</span>
            </button>
            <Modal modalRef={modalRef}>
                <ModalHeader title='Download data' icon='mdi--download' />
                <ModalContent>
                    <p>You can download a list of accessions that are used for the visualizations on this page:</p>
                    <div className='m-8'>
                        {downloadLinks
                            .map(({ label, filter, downloadFileBasename }) => ({
                                label,
                                url: assembleDownloadUrl(
                                    accessionDownloadFields,
                                    filter,
                                    downloadFileBasename,
                                    lapisUrl,
                                ),
                            }))
                            .map(({ label, url }) => (
                                <a key={label} className='link m-2 flex items-center gap-1' href={url}>
                                    <span className='iconify mdi--download text-xl' />
                                    {label}
                                </a>
                            ))}
                    </div>
                    <form method='dialog' className='flex flex-col items-end'>
                        <button className='underline'>Close</button>
                    </form>
                </ModalContent>
            </Modal>
        </>
    );
};
