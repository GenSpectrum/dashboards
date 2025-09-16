import { setupWorker } from 'msw/browser';
import '@testing-library/jest-dom/vitest';

import { type TestAPI, it as itBase } from 'vitest';

import setupDayjs from './src/util/setupDayjs.ts';
import { RouteMocker } from './vitest.common.setup.ts';

setupDayjs();

export const worker = setupWorker();

export const routeMocker = new RouteMocker(worker);

const itImpl = itBase.extend({
  routeMocker: [
    async ({}, use) => {
      await worker.start({ onUnhandledRequest: 'warn' });
  
      await use(routeMocker)
  
      worker.resetHandlers()
      worker.stop()
    },
    {
      auto: true,
    },
  ],
})

export const it = itImpl as TestAPI<{ routeMocker: RouteMocker}>;
