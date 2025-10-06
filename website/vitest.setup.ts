import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

import { AstroApiRouteMocker, BackendRouteMocker, LapisRouteMocker } from './routeMocker.ts';
import setupDayjs from './src/util/setupDayjs.ts';

setupDayjs();

export const testServer = setupServer();

export const astroApiRouteMocker = new AstroApiRouteMocker(testServer);

export const lapisRouteMocker = new LapisRouteMocker(testServer);

export const backendRouteMocker = new BackendRouteMocker(testServer);

beforeAll(() => testServer.listen({ onUnhandledRequest: 'error' }));

afterAll(() => testServer.close());

afterEach(() => testServer.resetHandlers());

beforeEach(() => lapisRouteMocker.mockOptionsAggregated());
