import { BackendError, UnknownBackendError } from '../components/subscriptions/backendApi/backendService.ts';

export function getErrorLogMessage(error: unknown): string {
    if (error instanceof BackendError) {
        return `BackendError: ${error.problemDetail.status} ${error.problemDetail.instance} [RequestId: ${error.requestId}] - ${error.problemDetail.detail}`;
    }

    if (error instanceof UnknownBackendError) {
        return `UnknownBackendError: ${error.status}`;
    }

    if (error instanceof Error) {
        const message = error.toString();
        if (error.cause instanceof Error) {
            return `${message} - cause: ${getErrorLogMessage(error.cause)}`;
        }
        return message;
    }

    if (typeof error === 'string') {
        return error;
    }

    return `Unknown error of type ${typeof error} (${error})`;
}
