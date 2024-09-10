import type { PropsWithChildren } from 'react';

import '@genspectrum/dashboard-components';

export function GsApp({ lapis, children }: PropsWithChildren<{ lapis: string }>) {
    return <gs-app lapis={lapis}>{children}</gs-app>;
}
