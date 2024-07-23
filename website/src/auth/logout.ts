import { Auth, raw, skipCSRFCheck } from '@auth/core';
import authConfig from 'auth:config';
import type { ResponseInternal } from '@auth/core/types';
import * as oauth from 'oauth4webapi';

export type LogoutResponse = Required<Pick<ResponseInternal, 'redirect' | 'cookies'>>;

export async function logout(request: Request) {
    const url = new URL(`${authConfig.prefix}/signout`, request.url);
    const authRequest = new Request(url, { headers: request.headers, method: 'POST' });
    return (await Auth(authRequest, { ...authConfig, raw, skipCSRFCheck })) as LogoutResponse;
}

export async function getKeycloakLogoutUrl(request: Request) {
    const keycloakProvider = authConfig.providers.find((provider) => 'id' in provider && provider.id === 'keycloak')!;
    const issuer = new URL(keycloakProvider.options?.issuer as string);
    const discoveryResponse = await oauth.discoveryRequest(issuer);
    const authorizationServer = await oauth.processDiscoveryResponse(issuer, discoveryResponse);

    const keycloakLogoutUrl = new URL(authorizationServer.end_session_endpoint!);
    const redirectUri = new URL(request.url);
    redirectUri.pathname = '/logout';
    keycloakLogoutUrl.searchParams.append('post_logout_redirect_uri', redirectUri.toString());
    keycloakLogoutUrl.searchParams.append('client_id', keycloakProvider.options?.clientId as string);
    return keycloakLogoutUrl.toString();
}
