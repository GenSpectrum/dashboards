import type { FC, ReactNode } from 'react';

import { RhydbError } from '../../../pathoplexusExplorer/dataLayer/transport/query.ts';
import { UNEXPECTED_ERROR } from '../../../pathoplexusExplorer/domain/text.ts';

type LoadingProps = { height?: string };

export const Loading: FC<LoadingProps> = ({ height = 'h-48' }) => {
    return (
        <div role='status' aria-label='Loading' className={`flex w-full items-center justify-center ${height}`}>
            <span className='loading loading-spinner loading-md text-stone-400' />
        </div>
    );
};

type ErrorMessageProps = { error: Error };

export const ErrorMessage: FC<ErrorMessageProps> = ({ error }) => {
    const rhydb = error instanceof RhydbError ? error : undefined;
    const message = rhydb === undefined ? error.message : rhydb.userMessage;
    return (
        <div role='alert' className='border border-red-200 bg-red-50 p-3 text-sm text-red-800'>
            <div className='font-semibold'>Could not load</div>
            <div className='mt-1 break-words'>{message}</div>
            {message !== UNEXPECTED_ERROR && (rhydb === undefined || rhydb.unexpected) && (
                <div className='mt-1'>{UNEXPECTED_ERROR}</div>
            )}
        </div>
    );
};

type EmptyProps = { children: ReactNode };

export const Empty: FC<EmptyProps> = ({ children }) => {
    return <div className='flex h-32 items-center justify-center text-sm text-stone-500'>{children}</div>;
};

type AsyncProps<T> = {
    state: { data: T | undefined; error: Error | null };
    height?: string;
    children: (data: T) => ReactNode;
};

export function Async<T>({ state, height, children }: AsyncProps<T>) {
    if (state.error !== null) {
        return <ErrorMessage error={state.error} />;
    }
    if (state.data === undefined) {
        return <Loading height={height} />;
    }
    return <>{children(state.data)}</>;
}
