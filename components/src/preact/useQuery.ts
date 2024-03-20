import { useEffect, useState } from 'preact/hooks';

export function useQuery<Data>(fetchDataCallback: () => Promise<Data>, dependencies: unknown[] = []) {
    const [data, setData] = useState<Data | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const result = await fetchDataCallback();
                setData(result);
                setError(null);
            } catch (error) {
                setError(error as Error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(dependencies)]);

    return { data, error, isLoading };
}
