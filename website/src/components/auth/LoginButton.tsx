import { signIn } from 'auth-astro/client';

export function LoginButton() {
    const login = () => {
        const callbackUrlThatDoesNotImmediatelyLogoutAgain = new URL(window.location.href).pathname.endsWith('/logout')
            ? new URL('/', window.location.href).toString()
            : undefined;
        signIn('github', { callbackUrl: callbackUrlThatDoesNotImmediatelyLogoutAgain }).catch(() => {});
    };

    return (
        <button className='cursor-pointer' onClick={login}>
            Login
        </button>
    );
}
