import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';

import { Modal, useModalRef } from '../styles/containers/Modal.tsx';
import type { InstanceLogger } from '../types/logMessage.ts';

type ErrorToastArguments = {
    error: Error;
    logMessage: string;
    errorToastMessages: [string, ...string[]];
};

export function useErrorToast(logger: InstanceLogger) {
    return {
        showErrorToast: ({ error, logMessage, errorToastMessages }: ErrorToastArguments) => {
            const errorId = uuidv4();
            logger.error(logMessage, {
                errorId,
            });
            toast.error(
                <>
                    {errorToastMessages.map((toastMessage, index) => (
                        <p className='mb-2' key={index}>
                            {toastMessage}
                        </p>
                    ))}
                    <ErrorReportToastModal errorId={errorId} error={error} />
                </>,
                {
                    position: 'bottom-left',
                    autoClose: false,
                },
            );
        },
    };
}

/**
 * Throw this error if you want to display the error message to the user.
 */
export class UserFacingError extends Error {}

export function ErrorReportToastModal({ errorId, error }: { errorId: string; error: Error }) {
    const modalRef = useModalRef();

    const openModal = () => {
        if (modalRef.current) {
            modalRef.current.showModal();
        }
    };

    return (
        <>
            {error instanceof UserFacingError && <p className='mb-2'>The error was: {error.message}</p>}
            <p>
                The problem persists?{' '}
                <button className='link' onClick={openModal}>
                    Help us fix the issue.
                </button>
            </p>
            <Modal modalRef={modalRef} size='large'>
                <div className='p-8'>
                    <ErrorReportInstruction errorId={errorId} currentUrl={window.location.href} error={error} />
                    <div className='modal-action'>
                        <form method='dialog'>
                            <button className='btn'>Close</button>
                        </form>
                    </div>
                </div>
            </Modal>
        </>
    );
}

const errorCutoff = 500;

export function ErrorReportInstruction({
    errorId,
    currentUrl,
    error,
}: {
    errorId: string;
    currentUrl: string;
    error?: { message: string };
}) {
    const errorInfoRef = useRef<HTMLUListElement>(null);

    return (
        <>
            <h3 className='mb-4 text-lg font-bold'>Help us fix the issue</h3>
            <div>
                Please create an issue on{' '}
                <a className='text-primary underline' href='https://github.com/GenSpectrum/dashboards'>
                    GitHub
                </a>
                . Describe what you did to trigger the error and include the following information so that we can track
                down the issue.
                <div className='mt-4 flex rounded-lg bg-gray-100 p-4'>
                    <ul ref={errorInfoRef} className='ml-6 grow list-inside list-disc overflow-scroll'>
                        <li>Error ID: {errorId}</li>
                        <li>Time: {new Date().toISOString()}</li>
                        <li>Current URL: {currentUrl}</li>
                        {error && (
                            <li>
                                Error message:{' '}
                                {error.message.length > errorCutoff
                                    ? `${error.message.substring(0, errorCutoff)}...`
                                    : error.message}
                            </li>
                        )}
                    </ul>
                    <CopyToClipboardButton getTextToCopy={() => errorInfoRef.current?.innerText} />
                </div>
            </div>
        </>
    );
}

function CopyToClipboardButton({ getTextToCopy }: { getTextToCopy: () => string | undefined }) {
    const [copiedRecently, setCopiedRecently] = useState(false);

    const onCopy = async () => {
        const text = getTextToCopy();
        if (text === undefined) {
            return;
        }
        await navigator.clipboard.writeText(text);
        setCopiedRecently(true);
        setTimeout(() => setCopiedRecently(false), 3000);
    };

    return (
        <div
            className='tooltip tooltip-left mx-4 my-auto'
            data-tip={`${copiedRecently ? 'Copied' : 'Copy'} error information to clipboard`}
        >
            {copiedRecently ? (
                <span className='iconify text-green mdi--tick text-2xl' />
            ) : (
                <button className='iconify mdi--content-copy text-xl' onClick={() => void onCopy()} />
            )}
        </div>
    );
}
