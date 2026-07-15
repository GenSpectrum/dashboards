import { useMutation } from '@tanstack/react-query';
import { createAuthClient } from 'better-auth/client';

import { withQueryProvider } from '../../backendApi/withQueryProvider.tsx';
import { getClientLogger } from '../../clientLogger.ts';
import { getErrorLogMessage } from '../../util/getErrorLogMessage.ts';
import { useErrorToast } from '../ErrorReportInstruction.tsx';

const logger = getClientLogger('LoginButton');
const authClient = createAuthClient();

export const LoginButton = withQueryProvider(LoginButtonInner);

function LoginButtonInner() {
    const { showErrorToast } = useErrorToast(logger);

    const loginMutation = useMutation({
        mutationFn: () => {
            const callbackUrlThatDoesNotImmediatelyLogoutAgain = new URL(window.location.href).pathname.endsWith(
                '/logout',
            )
                ? new URL('/', window.location.href).toString()
                : undefined;
            return authClient.signIn.social({
                provider: 'github',
                callbackURL: callbackUrlThatDoesNotImmediatelyLogoutAgain,
            });
        },
        onError: (error) => {
            showErrorToast({
                error: error instanceof Error ? error : new Error(String(error)),
                logMessage: `Login failed: ${getErrorLogMessage(error)}`,
                errorToastMessages: ['Login failed. Please try again.'],
            });
        },
    });

    return (
        <button className='cursor-pointer' onClick={() => loginMutation.mutate()}>
            Login
        </button>
    );
}
