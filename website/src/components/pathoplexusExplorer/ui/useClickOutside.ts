import { useEffect, useRef, type RefObject } from 'react';

/** Listen on the document so clicks outside the control can close it. */
export function useClickOutside(container: RefObject<HTMLElement | null>, open: boolean, close: () => void): void {
    const closing = useRef(close);
    closing.current = close;

    useEffect(() => {
        if (!open) {
            return;
        }
        const outside = (event: MouseEvent) => {
            if (container.current !== null && !container.current.contains(event.target as Node)) {
                closing.current();
            }
        };
        document.addEventListener('mousedown', outside);
        return () => document.removeEventListener('mousedown', outside);
    }, [container, open]);
}
