import { proxyToBackend, proxyToBackendNoAuth } from '../../../backendApi/backendProxy.ts';

export const GET = proxyToBackendNoAuth;
export const POST = proxyToBackend;
