import { useRef, useState } from 'react';

export function ErrorReportToastModal({ errorId }: { errorId: string }) {
    const modalRef = useRef<HTMLDialogElement>(null);

    const openModal = () => {
        if (modalRef.current) {
            modalRef.current.showModal();
        }
    };

    return (
        <>
            <p>
                The problem persists?{' '}
                <button className='link' onClick={openModal}>
                    Help us fix the issue.
                </button>
            </p>
            <dialog ref={modalRef} className='modal'>
                <div className='modal-box'>
                    <ErrorReportInstruction errorId={errorId} currentUrl={window.location.href} />
                    <div className='modal-action'>
                        <form method='dialog'>
                            <button className='btn'>Close</button>
                        </form>
                    </div>
                </div>
            </dialog>
        </>
    );
}

export function ErrorReportInstruction({ errorId, currentUrl }: { errorId: string; currentUrl: string }) {
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
                    <ul ref={errorInfoRef} className='ml-6 flex-grow list-inside list-disc overflow-scroll'>
                        <li>Error ID: {errorId}</li>
                        <li>Time: {new Date().toISOString()}</li>
                        <li>Current URL: {currentUrl}</li>
                    </ul>
                    <CopyToClipboardButton getTextToCopy={() => errorInfoRef.current?.innerText} />
                </div>
            </div>
        </>
    );
}

function CopyToClipboardButton({ getTextToCopy }: { getTextToCopy: () => string | undefined }) {
    const [copiedRecently, setCopiedRecently] = useState(false);

    return (
        <div
            className='tooltip tooltip-left mx-4 my-auto'
            data-tip={`${copiedRecently ? 'Copied' : 'Copy'} error information to clipboard`}
        >
            {copiedRecently ? (
                <span className='iconify text-2xl text-green mdi--tick' />
            ) : (
                <button
                    className='iconify text-xl mdi--content-copy'
                    onClick={async () => {
                        const text = getTextToCopy();
                        if (text === undefined) {
                            return;
                        }
                        await navigator.clipboard.writeText(text);
                        setCopiedRecently(true);
                        setTimeout(() => setCopiedRecently(false), 3000);
                    }}
                />
            )}
        </div>
    );
}
