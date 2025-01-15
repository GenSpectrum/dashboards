import type {PropsWithChildren} from "react";

export function ButtonWithIcon({children, icon}: PropsWithChildren<{icon: string}>) {
    return (
        <button className='flex items-center gap-1 hover:underline'>
            <div className={`iconify ${icon}`}></div>
            {children}
        </button>
    );
}
