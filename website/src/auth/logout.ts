import { auth } from '../auth';

export async function logout(request: Request) {
    return auth.api.signOut({ headers: request.headers });
}
