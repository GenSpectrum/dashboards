import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FC, JSX } from 'react';

export function withQueryProvider<Props>(WrappedComponent: FC<Props & JSX.IntrinsicAttributes>) {
    return (props: Props & JSX.IntrinsicAttributes) => {
        const queryClient = new QueryClient();
        return (
            <QueryClientProvider client={queryClient}>
                <WrappedComponent {...props} />
            </QueryClientProvider>
        );
    };
}
