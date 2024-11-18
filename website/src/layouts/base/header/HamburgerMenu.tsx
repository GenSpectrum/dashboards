import type { Session } from '@auth/core/types';
import { signIn } from 'auth-astro/client';
import { useEffect, useState } from 'react';

import { Hamburger } from './Hamburger';
import { OffCanvasOverlay, useOffCanvas } from './OffCanvasOverlay';

type PathogenMegaMenuSection = {
    headline: string;
    headlineBackgroundColor: string;
    navigationEntries: PathogenMegaMenuItems[];
};

export type PathogenMegaMenuItems = {
    label: string;
    href: string;
    underlineColor: string;
    externalLink: boolean;
};

type HamburgerMenuProps = {
    session: Session | null;
    pathogenMegaMenuSections: PathogenMegaMenuSection[];
    showLoggedInState: boolean;
};


function HamburgerMenu({ session, pathogenMegaMenuSections, showLoggedInState }: HamburgerMenuProps) {
    const { isOpen, toggle: toggleMenu, close: closeMenu } = useOffCanvas();

    useEffect(() => {
        const loginButton = document.getElementById('login');
        const callbackUrlThatDoesNotImmediatelyLogoutAgain = new URL(window.location.href).pathname.endsWith('/logout')
            ? new URL('/', window.location.href).toString()
            : undefined;
        
        const handleLoginClick = async () => {
            await signIn('github', { callbackUrl: callbackUrlThatDoesNotImmediatelyLogoutAgain } as any);
        };

        if (loginButton) {
            loginButton.addEventListener('click', handleLoginClick);
        }

        return () => {
            if (loginButton) {
                loginButton.removeEventListener('click', handleLoginClick);
            }
        };
    }, []);

    return (
        <div className='relative'>
            {!isOpen ? (
                <button className='my-4 mr-2 cursor-pointer bg-transparent' onClick={toggleMenu}>
                    <Hamburger isOpen={isOpen} />
                </button>
            ) : (
                <OffCanvasOverlay onClick={closeMenu} />
            )}

            <div
                className={`${isOpen ? 'translate-x-0' : 'translate-x-full'} fixed right-0 top-0 z-30 flex min-h-screen w-64 transform flex-col bg-white transition-transform duration-300 ease-in-out`}
            >
                <button
                    className='absolute right-3 top-4 z-50 cursor-pointer border-none bg-transparent'
                    onClick={closeMenu}
                >
                    <Hamburger isOpen={isOpen} />
                </button>
                <div className='flex max-h-screen min-h-screen flex-col justify-between overflow-y-auto p-5'>
                    <div>
                        <header>
                            <div className='h-10'>
                                <a href='/'>Genspectrum</a>
                            </div>
                        </header>
                        <div className='flex-grow divide-y-2 divide-solid divide-gray-300 border-b-2 border-t-2 border-solid border-gray-300'>
                            <OffCanvasNavItem key='/' text='Pathogens' level='one' path='/' />
                            {pathogenMegaMenuSections.map((section) => (
                                <OffCanvasNavSection section={section} key={section.headline} />
                            ))}
                            <OffCanvasNavItem key='/data' text='Data Sources' level='one' path='/data' />
                            <OffCanvasLogin showLoggedInState={showLoggedInState} session={session} />
                        </div>
                    </div>

                    <div className='flex justify-end'>
                        <a href='https://github.com/GenSpectrum'>
                            <div className='iconify size-10 justify-end mdi--github'></div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { HamburgerMenu };

type IndentLevel = 'one' | 'two';

type OffCanvasNavItemProps = {
    text: string;
    path: string | false;
    level: IndentLevel;
    type?: 'small';
    open?: () => void;
    id?: string;
};

function OffCanvasNavItem({ text, level, path, type, open, id }: OffCanvasNavItemProps) {
    const height = type === 'small' ? 'py-1' : 'py-3';

    const indent: { [K in IndentLevel]: string } = {
        one: 'ml-4',
        two: 'ml-8',
    };

    return (
        <div>
            <div className='flex items-center'>
                <button
                    onClick={open}
                    id={id}
                    className={`${indent[level]} ${height} ${level === 'one' ? 'font-bold' : ''}`}
                >
                    {path === false ? text : <a href={path}> {text}</a>}
                </button>
            </div>
        </div>
    );
}

type OffCanvasNavSectionProps = {
    section: PathogenMegaMenuSection;
};

function OffCanvasNavSection({ section }: OffCanvasNavSectionProps) {
    const [viewDiv, setViewDiv] = useState(false);
    const reverseView = () => {
        setViewDiv(!viewDiv);
    };

    return (
        <div key={section.headline}>
            <button onClick={reverseView} className={`ml-8 py-3 ${viewDiv === true ? 'font-bold' : ''}`}>
                {section.headline}
            </button>
            {viewDiv &&
                section.navigationEntries.map((entry) => (
                    <OffCanvasNavItem
                        key={entry.label}
                        text={entry.label}
                        path={entry.href}
                        level='two'
                        open={reverseView}
                    />
                ))}
        </div>
    );
}

function LoginButton() {
    const handleLogin = async () => {
        const currentUrl = new URL(window.location.href);
        const callbackUrlThatDoesNotImmediatelyLogoutAgain = currentUrl.pathname.endsWith('/logout')
            ? new URL('/', currentUrl).toString()
            : undefined;
        await signIn('github', { callbackUrl: callbackUrlThatDoesNotImmediatelyLogoutAgain } as any);
    };

    return <OffCanvasNavItem key='/login' text='Login' level='one' path={false} id='login' open={handleLogin} />;
}

export default LoginButton;

type OffCanvasLoginProps = {
    showLoggedInState: boolean;
    session: Session | null;
};

function OffCanvasLogin({ showLoggedInState, session }: OffCanvasLoginProps) {
    const [hover, setHover] = useState(false);
    const reverseView = () => {
        setHover(!hover);
    };

    return (
        <div>
            {showLoggedInState === true ? (
                <div>
                    <OffCanvasNavItem key='/login' text='My Account' level='one' path={false} open={reverseView} />
                    {hover === true && (
                        <div>
                            <div className='menu-title text-black'>
                                <a>{session != null && session.user?.name}</a>
                            </div>
                            <OffCanvasNavItem
                                key='/subscriptions'
                                text='Subscriptions'
                                level='two'
                                path='/subscriptions'
                            />
                            <OffCanvasNavItem key='/logout' text='Logout' level='two' path='/logout' />
                        </div>
                    )}
                </div>
            ) : (
                <LoginButton />
            )}
        </div>
    );
}
