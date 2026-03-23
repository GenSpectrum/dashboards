import { proxyToBackend, proxyToBackendOptionalAuth } from '../../../backendApi/backendProxy.ts';

export const GET = proxyToBackendOptionalAuth;
export const POST = proxyToBackend;
