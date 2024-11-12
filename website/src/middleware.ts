import { sequence } from 'astro:middleware';

import { errorMiddleware } from './middleware/errorMiddleware.ts';
import { loggingMiddleware } from './middleware/loggingMiddleware.ts';
import setupDayjs from './util/setupDayjs.ts';

// Workaround since Astro doesn't seem to support a global startup script for stuff that needs to be done exactly once
setupDayjs();

// Astro middleware
export const onRequest = sequence(errorMiddleware, loggingMiddleware);
