import { setupWorker } from 'msw/browser';
import '@testing-library/jest-dom/vitest';
import { type TestAPI, it as itBase } from 'vitest';

import { AstroApiRouteMocker, BackendRouteMocker, LapisRouteMocker } from './routeMocker.ts';
import setupDayjs from './src/util/setupDayjs.ts';

setupDayjs();

export const worker = setupWorker();

export const lapisRouteMocker = new LapisRouteMocker(worker);
export const astroApiRouteMocker = new AstroApiRouteMocker(worker);
export const backendRouteMocker = new BackendRouteMocker(worker);

const itImpl = itBase.extend({
    routeMockers: [
        // eslint-disable-next-line no-empty-pattern
        async ({}, use) => {
            await worker.start({ onUnhandledRequest: 'warn' });

            await use({ lapis: lapisRouteMocker, astro: astroApiRouteMocker, backend: BackendRouteMocker });

            worker.resetHandlers();
            worker.stop();
        },
        {
            auto: true,
        },
    ],
});

/**
 * Test extension to access the mocks. Import it:
 *
 *     import { it } from '../../../test-extend';
 *
 * use like this:
 *
 *     it('...', async ({ routeMockers }) => {
 *         routeMockers.lapis.mockReferenceGenome({
 *             nucleotideSequences: [{ name: 'main', sequence: 'ATGC' }],
 *             genes: [],
 *         });
 *         ...
 */
export const it = itImpl as TestAPI<{
    routeMockers: { lapis: LapisRouteMocker; astro: AstroApiRouteMocker; backend: BackendRouteMocker };
}>;
