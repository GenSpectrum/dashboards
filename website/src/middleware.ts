import { sequence } from 'astro:middleware';

import { errorMiddleware } from './middleware/errorMiddleware.ts';
import { loggingMiddleware } from './middleware/loggingMiddleware.ts';

// Astro middleware
export const onRequest = sequence(errorMiddleware, loggingMiddleware);
