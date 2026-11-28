import { useEffect, useRef, useState } from 'react';

export function useWidth<T extends HTMLElement>(initial = 800) {
    const ref = useRef<T>(null);
    const [width, setWidth] = useState(initial);
    useEffect(() => {
        const element = ref.current;
        if (element === null) {
            return;
        }
        const observer = new ResizeObserver((entries) => {
            const next = Math.floor(entries[0].contentRect.width);
            if (next > 0) {
                setWidth(next);
            }
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    return [ref, width] as const;
}
