import { corsPreflightResponse, proxyToBackend, proxyToBackendNoAuth } from '../../../backendApi/backendProxy.ts';

export const GET = proxyToBackendNoAuth;
export const PUT = proxyToBackend;
export const DELETE = proxyToBackend;
export const OPTIONS = corsPreflightResponse;
