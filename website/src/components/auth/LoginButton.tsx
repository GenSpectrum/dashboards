import { signIn } from 'auth-astro/client';

export function LoginButton() {
    const login = async () => {
        const callbackUrlThatDoesNotImmediatelyLogoutAgain = new URL(window.location.href).pathname.endsWith('/logout')
            ? new URL('/', window.location.href).toString()
            : undefined;
        await signIn('github', { callbackUrl: callbackUrlThatDoesNotImmediatelyLogoutAgain });
    };

    return <button onClick={void login}>Login</button>;
}
