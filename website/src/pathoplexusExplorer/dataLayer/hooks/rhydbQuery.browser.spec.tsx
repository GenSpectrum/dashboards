import { renderHook, waitFor } from '@testing-library/react';
import { type FC, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConnectionProvider, createRhydbQueryClient, useConnection, useRhydbQueryClient } from './connection.tsx';
import { useManyRows, useRows } from './rhydbQuery.ts';
import { RhydbError } from '../transport/query.ts';
import { table } from '../transport/relation.ts';

const INSTANCE = 'https://rhydb.example.org/pathoplexus';

type WrapperProps = { children: ReactNode };

function wrapper(queryClient = createRhydbQueryClient()): FC<WrapperProps> {
    const Wrapper: FC<WrapperProps> = ({ children }) => (
        <ConnectionProvider url={INSTANCE} queryClient={queryClient}>
            {children}
        </ConnectionProvider>
    );
    return Wrapper;
}

afterEach(() => vi.unstubAllGlobals());

describe('RhyDB reads', () => {
    it('go to the instance of the provider and give its rows', async () => {
        const fetching = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"n":3}\n', { status: 200 }));
        vi.stubGlobal('fetch', fetching);

        const { result } = renderHook(() => useRows(table('mpox').limit(1), 'Test panel'), { wrapper: wrapper() });

        await waitFor(() => expect(result.current.data).toEqual([{ n: 3 }]));
        expect(fetching).toHaveBeenCalledWith(`${INSTANCE}/query`, expect.objectContaining({ body: 'mpox.limit(1)' }));
    });

    it('send a rejected query once, and name the panel that asked', async () => {
        const fetching = vi
            .fn<typeof fetch>()
            .mockResolvedValue(new Response(JSON.stringify({ message: 'no such column' }), { status: 400 }));
        vi.stubGlobal('fetch', fetching);

        const { result } = renderHook(() => useRows('mpox.filter(nope = 1)', 'Test panel'), { wrapper: wrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.error).toBeInstanceOf(RhydbError);
        expect((result.current.error as RhydbError).label).toBe('Test panel');
        expect(fetching).toHaveBeenCalledTimes(1);
    });

    it('send nothing for a query that is not ready, and wait only for those that are', async () => {
        const fetching = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"n":1}\n', { status: 200 }));
        vi.stubGlobal('fetch', fetching);

        const { result } = renderHook(() => useManyRows([undefined, 'mpox.limit(1)'], 'Test panel'), {
            wrapper: wrapper(),
        });

        await waitFor(() => expect(result.current.data).toEqual([undefined, [{ n: 1 }]]));
        expect(fetching).toHaveBeenCalledTimes(1);
    });

    it('are cached on the query client that the provider is given', () => {
        const queryClient = createRhydbQueryClient();
        const { result } = renderHook(() => useRhydbQueryClient(), { wrapper: wrapper(queryClient) });
        expect(result.current).toBe(queryClient);
    });

    it('keep one connection while the instance stays the same', () => {
        const { result, rerender } = renderHook(() => useConnection(), { wrapper: wrapper() });
        const first = result.current;
        rerender();
        expect(result.current).toBe(first);
        expect(first.url).toBe(INSTANCE);
    });
});
