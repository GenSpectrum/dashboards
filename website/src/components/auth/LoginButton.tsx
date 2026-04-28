import { signIn } from 'auth-astro/client';

import { getClientLogger } from '../../clientLogger.ts';
import { getErrorLogMessage } from '../../util/getErrorLogMessage.ts';
import { useErrorToast } from '../ErrorReportInstruction.tsx';

const logger = getClientLogger('LoginButton');

export function LoginButton() {
    const { showErrorToast } = useErrorToast(logger);

    const login = () => {
        const callbackUrlThatDoesNotImmediatelyLogoutAgain = new URL(window.location.href).pathname.endsWith('/logout')
            ? new URL('/', window.location.href).toString()
            : undefined;
        signIn('github', { callbackUrl: callbackUrlThatDoesNotImmediatelyLogoutAgain }).catch((error: unknown) => {
            showErrorToast({
                error: error instanceof Error ? error : new Error(String(error)),
                logMessage: `Login failed: ${getErrorLogMessage(error)}`,
                errorToastMessages: ['Login failed. Please try again.'],
            });
        });
    };

    return (
        <button className='cursor-pointer' onClick={login}>
            Login
        </button>
    );
}
