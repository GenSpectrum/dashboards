import { setupWorker } from 'msw/browser';
import '@testing-library/jest-dom/vitest';
import { it as itBase } from 'vitest';

import { AstroApiRouteMocker, BackendRouteMocker, CovSpectrumRouteMocker, LapisRouteMocker } from './routeMocker.ts';
import setupDayjs from './src/util/setupDayjs.ts';

setupDayjs();

export const worker = setupWorker();

export const lapisRouteMocker = new LapisRouteMocker(worker);
export const astroApiRouteMocker = new AstroApiRouteMocker(worker);
export const backendRouteMocker = new BackendRouteMocker(worker);
export const covSpectrumRouteMocker = new CovSpectrumRouteMocker(worker);

const workerFixture = itBase.extend<{ mswWorker: never }>({
    mswWorker: [
        // eslint-disable-next-line no-empty-pattern -- vitest needs the 1st arg to be an object destructor
        async ({}, use) => {
            await worker.start({ onUnhandledRequest: 'error' });
            await use(undefined as never);
            worker.stop();
        },
        { scope: 'file', auto: true },
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
export const it = workerFixture.extend<{
    routeMockers: {
        lapis: LapisRouteMocker;
        astro: AstroApiRouteMocker;
        backend: BackendRouteMocker;
        covSpectrum: CovSpectrumRouteMocker;
    };
}>({
    routeMockers: [
        // eslint-disable-next-line no-empty-pattern -- vitest needs the 1st arg to be an object destructor
        async ({}, use) => {
            await use({
                lapis: lapisRouteMocker,
                astro: astroApiRouteMocker,
                backend: backendRouteMocker,
                covSpectrum: covSpectrumRouteMocker,
            });

            worker.resetHandlers();
        },
        {
            auto: true,
        },
    ],
});
