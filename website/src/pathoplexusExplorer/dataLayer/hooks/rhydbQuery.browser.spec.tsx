import { act, renderHook, waitFor } from '@testing-library/react';
import { type FC, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useScopeFilter } from './analyses.ts';
import { ConnectionProvider, useConnection } from './connection.tsx';
import { useManyRows, useRows } from './rhydbQuery.ts';
import { CATALOG } from '../../domain/catalog.ts';
import { WORLD } from '../../domain/geography.ts';
import { parseSubject } from '../../domain/subject.ts';
import { defined } from '../../test/defined.fixture.ts';
import { table } from '../transport/relation.ts';

const versionHeader = { headers: new Headers([['data-version', '100']]) };
const INSTANCE = 'https://rhydb.example.org/pathoplexus';

const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <ConnectionProvider url={INSTANCE}>{children}</ConnectionProvider>
);

function answering(response: () => Response) {
    const fetching = vi.fn<typeof fetch>().mockImplementation(() => Promise.resolve(response()));
    vi.stubGlobal('fetch', fetching);
    return fetching;
}

afterEach(() => vi.unstubAllGlobals());

describe('RhyDB reads', () => {
    it('go to the instance of the provider and give its rows', async () => {
        const fetching = answering(() => new Response('{"n":3}\n', versionHeader));

        const { result } = renderHook(() => useRows(table('mpox').limit(1), 'Test panel'), { wrapper: Wrapper });

        await waitFor(() => expect(result.current.data).toEqual([{ n: 3 }]));
        expect(fetching).toHaveBeenCalledWith(`${INSTANCE}/query`, expect.objectContaining({ body: 'mpox.limit(1)' }));
    });

    it('are sent once by the same panels asking for the same query', async () => {
        const fetching = answering(() => new Response('{"n":3}\n', versionHeader));

        const { result } = renderHook(
            () => [useRows('mpox.limit(1)', 'Test panel'), useRows('mpox.limit(1)', 'Other panel')],
            { wrapper: Wrapper },
        );

        await waitFor(() => expect(result.current.map((rows) => rows.data)).toEqual([[{ n: 3 }], [{ n: 3 }]]));
        expect(fetching).toHaveBeenCalledTimes(1);
    });

    it('are not tried again by the query client once they have failed', async () => {
        const fetching = answering(() => new Response(JSON.stringify({ message: 'no such column' }), { status: 400 }));

        const { result } = renderHook(() => useRows('mpox.filter(nope = 1)', 'Test panel'), { wrapper: Wrapper });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(fetching).toHaveBeenCalledTimes(1);
    });

    it('send nothing for a query that is not ready, and wait only for those that are', async () => {
        const fetching = answering(() => new Response('{"n":1}\n', versionHeader));

        const { result } = renderHook(() => useManyRows([undefined, 'mpox.limit(1)'], 'Test panel'), {
            wrapper: Wrapper,
        });

        await waitFor(() => expect(result.current.data).toEqual([undefined, [{ n: 1 }]]));
        expect(fetching).toHaveBeenCalledTimes(1);
    });

    it('shares the server response while each reader keeps its own column names', async () => {
        const fetching = answering(() => new Response('{"c0":"Brazil"}', versionHeader));
        const text = 'samples.project({c0})';
        const named = {
            render: () => text,
            decode: (rows: readonly { c0?: unknown }[]) => rows.map((row) => ({ country: String(row.c0) })),
        };
        const { result } = renderHook(() => [useRows(text, 'Source').data, useManyRows([named], 'Places').data], {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current).toEqual([[{ c0: 'Brazil' }], [[{ country: 'Brazil' }]]]));
        expect(fetching).toHaveBeenCalledTimes(1);
    });

    it('updates a comparison filter when only the excluded subject changes', async () => {
        answering(() => new Response('', versionHeader));
        const what = defined(parseSubject('pathogen:rsv_a', CATALOG), 'RSV-A');
        const { result, rerender } = renderHook(
            ({ lineage }) => {
                const except = parseSubject(`pathogen:rsv_a/lineage=${lineage}`, CATALOG);
                return useScopeFilter({ what, except, where: WORLD, period: {} }, CATALOG);
            },
            { wrapper: Wrapper, initialProps: { lineage: 'A' } },
        );
        await waitFor(() => expect(result.current.data?.filter('rsv_a')?.render()).toContain("'A'"));
        rerender({ lineage: 'B' });
        expect(result.current.data?.filter('rsv_a')?.render()).toContain("'B'");
    });

    it('refreshes cached panels together when a focus check finds new data', async () => {
        let version = '100';
        const fetching = answering(
            () =>
                new Response(JSON.stringify({ n: Number(version) }), {
                    headers: new Headers([['data-version', version]]),
                }),
        );
        const { result } = renderHook(() => useManyRows(['left', 'right'], 'Test panel'), { wrapper: Wrapper });
        await waitFor(() => expect(result.current.data).toEqual([[{ n: 100 }], [{ n: 100 }]]));
        version = '200';
        await act(() => window.dispatchEvent(new Event('visibilitychange')));
        await waitFor(() => expect(result.current.data).toEqual([[{ n: 200 }], [{ n: 200 }]]));
        expect(fetching.mock.calls.filter(([, options]) => options?.body === 'left')).toHaveLength(2);
    });

    it('discards outstanding responses when a panel reads a newer snapshot', async () => {
        let version = '100';
        let release!: (response: Response) => void;
        const pending = new Promise<Response>((resolve) => {
            release = resolve;
        });
        const answer = (value: string) =>
            new Response(JSON.stringify({ n: Number(value) }), {
                headers: new Headers([['data-version', value]]),
            });
        const fetching = vi.fn<typeof fetch>((_, options) =>
            version === '100' && options?.body === 'slow' ? pending : Promise.resolve(answer(version)),
        );
        vi.stubGlobal('fetch', fetching);
        const seen: number[][] = [];
        const { result, rerender } = renderHook(
            ({ extra }) => {
                const first = useRows('first', 'First');
                const slow = useRows('slow', 'Slow');
                const last = useRows(extra ? 'new' : undefined, 'New');
                const counts = [first, slow, last].flatMap(({ data }) =>
                    data === undefined ? [] : [Number(data[0].n)],
                );
                seen.push(counts);
                return counts;
            },
            { wrapper: Wrapper, initialProps: { extra: false } },
        );
        await waitFor(() => expect(result.current).toEqual([100]));
        version = '200';
        rerender({ extra: true });
        await waitFor(() => expect(result.current).toEqual([200, 200, 200]));
        await act(async () => {
            release(answer('100'));
            await pending;
        });
        expect(result.current).toEqual([200, 200, 200]);
        expect(seen.some((counts) => new Set(counts).size > 1)).toBe(false);
    });

    it('clears cached counts when the returning tab cannot verify the database version', async () => {
        let available = true;
        answering(() => (available ? new Response('{"n":100}', versionHeader) : new Response('', { status: 400 })));
        const { result } = renderHook(() => useRows('left', 'Panel'), { wrapper: Wrapper });
        await waitFor(() => expect(result.current.data).toEqual([{ n: 100 }]));
        available = false;
        await act(() => window.dispatchEvent(new Event('visibilitychange')));
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.data).toBeUndefined();
    });

    it('withholds rows when their snapshot cannot be identified', async () => {
        answering(() => new Response('{"n":42}'));
        const { result } = renderHook(() => useRows('left', 'Test panel'), { wrapper: Wrapper });
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.data).toBeUndefined();
    });

    it('keep one connection while the instance stays the same', () => {
        const { result, rerender } = renderHook(() => useConnection(), { wrapper: Wrapper });
        const first = result.current;

        rerender();

        expect(result.current).toBe(first);
    });
});
