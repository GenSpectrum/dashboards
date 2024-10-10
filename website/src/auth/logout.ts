import { Auth, raw, skipCSRFCheck } from '@auth/core';
import type { ResponseInternal } from '@auth/core/types';
import authConfig from 'auth:config';

export type LogoutResponse = Required<Pick<ResponseInternal, 'redirect' | 'cookies'>>;

export async function logout(request: Request) {
    const url = new URL(`${authConfig.prefix}/signout`, request.url);
    const authRequest = new Request(url, { headers: request.headers, method: 'POST' });
    return (await Auth(authRequest, { ...authConfig, raw, skipCSRFCheck })) as LogoutResponse;
}
