import { useRef } from 'react';

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
    return (
        <>
            <h3 className='mb-4 text-lg font-bold'>Help us fix the issue</h3>
            <p>
                Please create an issue on{' '}
                <a className='text-primary underline' href='https://github.com/GenSpectrum/dashboards'>
                    GitHub
                </a>
                . Describe what you did to trigger the error and include the following information so that we can track
                down the issue:
                <ul className='ml-6 mt-2 list-disc'>
                    <li>Error ID: {errorId}</li>
                    <li>Time: {new Date().toISOString()}</li>
                    <li>Current URL: {currentUrl}</li>
                </ul>
            </p>
        </>
    );
}
