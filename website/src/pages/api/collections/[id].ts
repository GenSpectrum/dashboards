import { proxyToBackend, proxyToBackendOptionalAuth } from '../../../backendApi/backendProxy.ts';

export const GET = proxyToBackendOptionalAuth;
export const PUT = proxyToBackend;
export const DELETE = proxyToBackend;
