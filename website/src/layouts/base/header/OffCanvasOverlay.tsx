import { useCallback, useState } from 'react';

type Props = {
    onClick?: () => void;
    className?: string;
};

export function OffCanvasOverlay({ onClick, className }: Props): JSX.Element {
    return <div className={`fixed inset-0 z-20 bg-gray-800 bg-opacity-50 ${className ?? ''}`} onClick={onClick} />;
}

export const useOffCanvas = (initialIsOpen = false) => {
    const [isOpen, setOpen] = useState(initialIsOpen);

    const open = useCallback(() => {
        document.body.style.overflow = 'hidden'; // This makes the background not scrollable
        setOpen(true);
    }, [setOpen]);

    const close = useCallback(() => {
        document.body.style.overflow = 'unset';
        setOpen(false);
    }, [setOpen]);

    const toggle = useCallback(() => {
        if (isOpen) {
            close();
        } else {
            open();
        }
    }, [isOpen, open, close]);

    return { isOpen, open, close, toggle };
};
