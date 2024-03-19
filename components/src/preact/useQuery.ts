import { useEffect, useState } from 'preact/hooks';

export function useQuery<Data>(fetchDataCallback: () => Promise<Data>, dependencies: unknown[] = []) {
    const [data, setData] = useState<Data | null>(null);
    const [error, setError] = useState<unknown>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(async () => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                console.log('useEffect');
                const result = await fetchDataCallback();
                console.log('useEffect done');
                setData(result);
                setError(null);
            } catch (error) {
                setError(error);
            } finally {
                setIsLoading(false);
            }
        };

        await fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(dependencies)]);

    return { data, error, isLoading };
}
