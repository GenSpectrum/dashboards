import { corsPreflightResponse, proxyToBackendNoAuth } from '../../../backendApi/backendProxy.ts';

export const GET = proxyToBackendNoAuth;
export const OPTIONS = corsPreflightResponse;
