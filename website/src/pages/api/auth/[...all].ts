import type { APIRoute } from 'astro';

import { auth } from '../../../auth';

export const ALL: APIRoute = ({ request }) => auth.handler(request);
